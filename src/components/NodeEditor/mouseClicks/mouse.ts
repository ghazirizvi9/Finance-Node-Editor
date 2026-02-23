/**
 * useCanvasInteractions
 * =====================
 * Central hub for every mouse / pointer / click / zoom / pan handler used on the
 * ReactFlow canvas.  Extracted from index.tsx so every interaction is easy to find
 * in one place for debugging & maintenance.
 *
 * Sections (search by §):
 *   § Refs & State
 *   § Two-Button Pan
 *   § Selection-Drag Blocking
 *   § Window Pointer Events (pan movement, library drag, cleanup)
 *   § Context-Menu Dismiss
 *   § Library Panel Drag
 *   § Drag & Drop (library → canvas)
 *   § Node Drag (reposition existing nodes)
 *   § Viewport / Zoom
 *   § Click & Selection (pane, node, double-click)
 *   § Context Menu (pane, node)
 */

import { useEffect, useRef, useState } from 'react';
import type { Node, ReactFlowInstance, Viewport } from '@xyflow/react';
import { createNodeFromLibrary } from '../frontEndUtilities/factories';
import { cloneWorkflowGraph } from '../frontEndUtilities/graphUtils';
import type { FinanceFlowNode, WorkflowGraph } from '../frontEndUtilities/types';

// ─── Public types ────────────────────────────────────────────────────────────

export interface CanvasContextMenuState {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
}

export interface UseCanvasInteractionsConfig {
  reactFlowInstance: ReactFlowInstance | null;
  graph: WorkflowGraph;
  setGraph: React.Dispatch<React.SetStateAction<WorkflowGraph>>;
  commitGraph: (updater: (current: WorkflowGraph) => WorkflowGraph) => void;
  setShowInspectorPanel: (show: boolean) => void;
  /** Push a pre-drag snapshot into the undo stack. */
  pushDragToHistory: (snapshot: WorkflowGraph) => void;
}

export interface CanvasInteractions {
  // ── state ──
  isTwoButtonPanning: boolean;
  viewportZoom: number;
  contextMenu: CanvasContextMenuState | null;
  setContextMenu: React.Dispatch<React.SetStateAction<CanvasContextMenuState | null>>;
  libraryPosition: { x: number; y: number };
  setLibraryPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;

  // ── refs ──
  canvasShellRef: React.RefObject<HTMLDivElement>;
  dragSnapshotRef: React.MutableRefObject<WorkflowGraph | null>;

  // ── shell handlers ──
  blockNonLeftSelectionPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleCanvasMouseDownCapture: (event: React.MouseEvent<HTMLDivElement>) => void;

  // ── ReactFlow event-prop handlers ──
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onNodeDragStart: () => void;
  onNodeDragStop: () => void;
  onMove: (_event: unknown, viewport: Viewport) => void;
  onPaneClick: () => void;
  onNodeClick: (_event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick: (_event: React.MouseEvent, node: Node) => void;
  onDoubleClick: () => void;
  onPaneContextMenu: (event: React.MouseEvent | MouseEvent) => void;
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;

  // ── library panel ──
  handleLibraryDragHandlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;

  // ── helpers ──
  openCanvasContextMenu: (clientX: number, clientY: number) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCanvasInteractions(config: UseCanvasInteractionsConfig): CanvasInteractions {
  const {
    reactFlowInstance,
    graph,
    setGraph,
    commitGraph,
    setShowInspectorPanel,
    pushDragToHistory,
  } = config;

  // ═══════════════════════════════════════════════════════════════════════════
  // § Refs & State
  // ═══════════════════════════════════════════════════════════════════════════

  const [isTwoButtonPanning, setIsTwoButtonPanning] = useState(false);
  const [viewportZoom, setViewportZoom] = useState(1);
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null);
  const [libraryPosition, setLibraryPosition] = useState({ x: 18, y: 18 });

  const canvasShellRef = useRef<HTMLDivElement>(null!);
  const dragSnapshotRef = useRef<WorkflowGraph | null>(null);
  const twoButtonPanRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const libraryDragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const suppressContextMenuUntilRef = useRef(0);
  const lastRightClickRef = useRef(0);
  const lastNodeInteractionRef = useRef(0);

  // ═══════════════════════════════════════════════════════════════════════════
  // § Two-Button Pan
  // ═══════════════════════════════════════════════════════════════════════════

  /** Check whether the event target is a valid area to begin a two-button pan. */
  const canStartTwoButtonPan = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    if (!target.closest('.react-flow')) return false;
    if (target.closest('.ne-node-library, .ne-node-inspector, .ne-code-panel, .ne-canvas-context-menu')) {
      return false;
    }
    if (target.closest('.react-flow__handle')) return false;
    return Boolean(target.closest('.react-flow__pane, .react-flow__node'));
  };

  /** Activate two-button panning on mousedown when both L+R are held. */
  const beginTwoButtonPan = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (twoButtonPanRef.current) return;

    const hasLeft = (event.buttons & 1) === 1;
    const hasRight = (event.buttons & 2) === 2;
    if (!(hasLeft && hasRight)) return;
    if (!canStartTwoButtonPan(event.target)) return;

    twoButtonPanRef.current = { lastX: event.clientX, lastY: event.clientY };
    dragSnapshotRef.current = null;
    suppressContextMenuUntilRef.current = Date.now() + 400;
    setIsTwoButtonPanning(true);
    canvasShellRef.current?.classList.add('is-two-button-panning');
    setContextMenu(null);
    setShowInspectorPanel(false);
    event.preventDefault();
    event.stopPropagation();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § Selection-Drag Blocking
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Should we block ReactFlow's built-in selection-box drag?
   * Returns true when the pointer is on the pane and the button is NOT left-only.
   */
  const shouldBlockSelectionDragStart = (target: EventTarget | null, buttons: number): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    if (!target.closest('.react-flow')) return false;
    if (target.closest('.ne-node-library, .ne-node-inspector, .ne-code-panel, .ne-canvas-context-menu')) {
      return false;
    }
    return Boolean(target.closest('.react-flow__pane')) && buttons !== 1;
  };

  /** Block non-left-click pointer-down so RF doesn't start a selection rectangle. */
  const blockNonLeftSelectionPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    const hasLeft = (event.buttons & 1) === 1;
    if (hasLeft) return;
    if (!shouldBlockSelectionDragStart(event.target, event.buttons)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  /** Capture-phase mousedown: starts two-button pan OR blocks selection drag. */
  const handleCanvasMouseDownCapture = (event: React.MouseEvent<HTMLDivElement>): void => {
    beginTwoButtonPan(event);
    if (event.defaultPrevented) return;
    if (!shouldBlockSelectionDragStart(event.target, event.buttons)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § Window Pointer Events (pan movement, library drag, cleanup)
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const endTwoButtonPan = () => {
      const wasPanning = twoButtonPanRef.current !== null;
      twoButtonPanRef.current = null;
      setIsTwoButtonPanning(false);
      canvasShellRef.current?.classList.remove('is-two-button-panning');
      if (wasPanning) {
        suppressContextMenuUntilRef.current = Math.max(
          suppressContextMenuUntilRef.current,
          Date.now() + 400,
        );
        lastRightClickRef.current = 0;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      // ── Library panel drag ──
      const offset = libraryDragOffsetRef.current;
      if (offset) {
        const shellRect = canvasShellRef.current?.getBoundingClientRect();
        const nextX = event.clientX - offset.x;
        const nextY = event.clientY - offset.y;

        if (!shellRect) {
          setLibraryPosition({ x: Math.max(8, nextX), y: Math.max(8, nextY) });
        } else {
          const panelWidth = 336;
          const panelHeight = 520;
          const minX = 8;
          const minY = 8;
          const maxX = Math.max(minX, shellRect.width - panelWidth - 8);
          const maxY = Math.max(minY, shellRect.height - panelHeight - 8);

          setLibraryPosition({
            x: Math.min(maxX, Math.max(minX, nextX - shellRect.left)),
            y: Math.min(maxY, Math.max(minY, nextY - shellRect.top)),
          });
        }
      }

      // ── Two-button pan: auto-start or continue ──
      const panState = twoButtonPanRef.current;
      const hasLeftNow = (event.buttons & 1) === 1;
      const hasRightNow = (event.buttons & 2) === 2;

      if (!panState && hasLeftNow && hasRightNow && reactFlowInstance) {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          target.closest('.react-flow') &&
          !target.closest(
            '.ne-node-library, .ne-node-inspector, .ne-code-panel, .ne-canvas-context-menu, .react-flow__handle',
          )
        ) {
          twoButtonPanRef.current = { lastX: event.clientX, lastY: event.clientY };
          dragSnapshotRef.current = null;
          suppressContextMenuUntilRef.current = Date.now() + 400;
          setIsTwoButtonPanning(true);
          canvasShellRef.current?.classList.add('is-two-button-panning');
          setContextMenu(null);
          return;
        }
      }

      if (panState && reactFlowInstance) {
        if (!(hasLeftNow && hasRightNow)) {
          endTwoButtonPan();
        } else {
          const deltaX = event.clientX - panState.lastX;
          const deltaY = event.clientY - panState.lastY;
          if (deltaX !== 0 || deltaY !== 0) {
            panState.lastX = event.clientX;
            panState.lastY = event.clientY;
            const viewport = reactFlowInstance.getViewport();
            void reactFlowInstance.setViewport({
              ...viewport,
              x: viewport.x + deltaX,
              y: viewport.y + deltaY,
            });
            suppressContextMenuUntilRef.current = Date.now() + 400;
          }
        }
      }
    };

    const onPointerUp = () => {
      libraryDragOffsetRef.current = null;
      endTwoButtonPan();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [reactFlowInstance]);

  // ═══════════════════════════════════════════════════════════════════════════
  // § Context-Menu Dismiss
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const onWindowPointerDown = () => setContextMenu(null);
    window.addEventListener('pointerdown', onWindowPointerDown);
    return () => window.removeEventListener('pointerdown', onWindowPointerDown);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // § Library Panel Drag
  // ═══════════════════════════════════════════════════════════════════════════

  /** Pointer-down on the library's drag handle — stores offset for pointerMove. */
  const handleLibraryDragHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    const shellRect = canvasShellRef.current?.getBoundingClientRect();
    const baseLeft = shellRect ? shellRect.left + libraryPosition.x : libraryPosition.x;
    const baseTop = shellRect ? shellRect.top + libraryPosition.y : libraryPosition.y;
    libraryDragOffsetRef.current = {
      x: event.clientX - baseLeft,
      y: event.clientY - baseTop,
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § Drag & Drop (library → canvas)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Allow drop by preventing the default dragover behaviour. */
  const onDragOver = (event: React.DragEvent): void => {
    if (isTwoButtonPanning) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  /** Create a new node where the library item was dropped. */
  const onDrop = (event: React.DragEvent): void => {
    if (isTwoButtonPanning) return;
    event.preventDefault();
    if (!reactFlowInstance) return;

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const created = createNodeFromLibrary(type as FinanceFlowNode['type'], position);
    if (!created) return;

    commitGraph((current) => ({
      ...current,
      nodes: [...current.nodes, created],
    }));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § Node Drag (reposition existing nodes)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Snapshot the graph before the user starts dragging a node — for undo. */
  const onNodeDragStart = (): void => {
    dragSnapshotRef.current = cloneWorkflowGraph(graph);
  };

  /** Push the pre-drag snapshot into history when dragging stops. */
  const onNodeDragStop = (): void => {
    if (!dragSnapshotRef.current) return;
    pushDragToHistory(dragSnapshotRef.current);
    dragSnapshotRef.current = null;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § Viewport / Zoom
  // ═══════════════════════════════════════════════════════════════════════════

  /** ReactFlow fires this on every viewport change (pan / zoom / fit). */
  const onMove = (_event: unknown, viewport: Viewport): void => {
    setViewportZoom(viewport.zoom);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § Click & Selection (pane, node, double-click)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Click on empty canvas — dismiss context menu & inspector. */
  const onPaneClick = (): void => {
    if (isTwoButtonPanning) return;
    setContextMenu(null);
    setShowInspectorPanel(false);
  };

  /** Single-click a node — open inspector for non-table nodes. */
  const onNodeClick = (_event: React.MouseEvent, node: Node): void => {
    if (isTwoButtonPanning) return;
    lastNodeInteractionRef.current = Date.now();
    setContextMenu(null);
    if (node.type !== 'parentTable') {
      setShowInspectorPanel(true);
    }
  };

  /** Double-click a node — open inspector for parentTable nodes. */
  const onNodeDoubleClick = (_event: React.MouseEvent, node: Node): void => {
    if (isTwoButtonPanning) return;
    lastNodeInteractionRef.current = Date.now();
    if (node.type === 'parentTable') {
      setShowInspectorPanel(true);
    }
  };

  /**
   * Double-click on canvas → zoom in ×1.2.
   * Skipped when a node was just interacted with (within 400ms) to prevent
   * node-double-click from also triggering a zoom.
   */
  const onDoubleClick = (): void => {
    if (isTwoButtonPanning) return;
    if (Date.now() - lastNodeInteractionRef.current < 400) return;
    const vp = reactFlowInstance?.getViewport();
    if (vp) reactFlowInstance?.setViewport({ ...vp, zoom: vp.zoom * 1.2 }, { duration: 200 });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // § Context Menu (pane, node)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Convert screen coords → flow coords and open the floating context menu. */
  const openCanvasContextMenu = (clientX: number, clientY: number): void => {
    const flowPosition = reactFlowInstance?.screenToFlowPosition({ x: clientX, y: clientY }) ?? {
      x: 0,
      y: 0,
    };
    setContextMenu({
      x: clientX,
      y: clientY,
      flowX: flowPosition.x,
      flowY: flowPosition.y,
    });
  };

  /**
   * Right-click on empty canvas.
   * Double-right-click within 400ms → zoom out ×0.8.
   * Single right-click → record timestamp (for next double-right-click check).
   */
  const onPaneContextMenu = (event: React.MouseEvent | MouseEvent): void => {
    event.preventDefault();
    if (isTwoButtonPanning) return;
    if (Date.now() < suppressContextMenuUntilRef.current) return;

    const now = Date.now();
    if (now - lastRightClickRef.current < 400) {
      const vp = reactFlowInstance?.getViewport();
      if (vp) reactFlowInstance?.setViewport({ ...vp, zoom: vp.zoom * 0.8 }, { duration: 200 });
      lastRightClickRef.current = 0;
    } else {
      lastRightClickRef.current = now;
    }
  };

  /** Right-click on a node — select it and open the canvas context menu. */
  const onNodeContextMenu = (event: React.MouseEvent, node: Node): void => {
    event.preventDefault();
    if (isTwoButtonPanning) return;
    if (Date.now() < suppressContextMenuUntilRef.current) return;

    setGraph((current) => ({
      ...current,
      nodes: current.nodes.map((item) => ({
        ...item,
        selected: node.selected ? item.selected : item.id === node.id,
      })) as FinanceFlowNode[],
      edges: current.edges.map((edge) => ({ ...edge, selected: false })),
    }));
    openCanvasContextMenu(event.clientX, event.clientY);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Return
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // state
    isTwoButtonPanning,
    viewportZoom,
    contextMenu,
    setContextMenu,
    libraryPosition,
    setLibraryPosition,

    // refs
    canvasShellRef,
    dragSnapshotRef,

    // shell handlers
    blockNonLeftSelectionPointerDown,
    handleCanvasMouseDownCapture,

    // ReactFlow event-prop handlers
    onDragOver,
    onDrop,
    onNodeDragStart,
    onNodeDragStop,
    onMove,
    onPaneClick,
    onNodeClick,
    onNodeDoubleClick,
    onDoubleClick,
    onPaneContextMenu,
    onNodeContextMenu,

    // library panel
    handleLibraryDragHandlePointerDown,

    // helpers
    openCanvasContextMenu,
  };
}
