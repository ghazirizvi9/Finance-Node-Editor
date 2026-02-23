import React from 'react';
import type { EditorTheme } from '../frontEndUtilities/types';

interface BottomToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitView: () => void;
  onResetZoom: () => void;
  zoomLabel: string;
  theme: EditorTheme;
  onToggleTheme: () => void;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomOut,
  onZoomIn,
  onFitView,
  onResetZoom,
  zoomLabel,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className="ne-bottom-toolbar" role="toolbar" aria-label="Canvas controls">
      <div className="ne-toolbar-group">
        <button type="button" className="ne-toolbar-btn" onClick={onZoomOut} title="Zoom out">
          -
        </button>
        <button type="button" className="ne-toolbar-zoom" onClick={onFitView} title="Fit canvas">
          {zoomLabel}
        </button>
        <button type="button" className="ne-toolbar-btn" onClick={onZoomIn} title="Zoom in">
          +
        </button>
        <button type="button" className="ne-toolbar-btn" onClick={onResetZoom} title="Reset to 100%">
          ⊙
        </button>
      </div>

      <div className="ne-toolbar-divider" />

      <div className="ne-toolbar-group">
        <button
          type="button"
          className="ne-toolbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          aria-label="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          className="ne-toolbar-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          aria-label="Redo"
        >
          ↷
        </button>
      </div>

      <div className="ne-toolbar-divider" />

      <div className="ne-toolbar-group">
        <button
          type="button"
          className="ne-toolbar-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☼' : '☾'}
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
