import React from 'react';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onEvaluate: () => void;
  onPublish: () => void;
  isEvaluating: boolean;
  onToggleCodePanel: () => void;
  codePanelOpen: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  projectName,
  onProjectNameChange,
  onEvaluate,
  onPublish,
  isEvaluating,
  onToggleCodePanel,
  codePanelOpen,
}) => {
  return (
    <header className="ne-top-bar" aria-label="Workflow editor toolbar">
      <div className="ne-top-bar-left">
        <div className="ne-project-title">
          <input
            type="text"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            className="ne-project-input"
            aria-label="Workflow title"
            size={Math.min(30, Math.max(12, projectName.length || 12))}
          />
          <span className="ne-draft-badge">Draft</span>
        </div>
      </div>

      <div className="ne-top-bar-right">
        <button
          type="button"
          className={`ne-action-btn ${codePanelOpen ? 'active' : ''}`}
          onClick={onToggleCodePanel}
        >
          {'</>'}
          <span>Code</span>
        </button>

        <div className="ne-header-divider" />

        <button
          type="button"
          className={`ne-action-btn ${isEvaluating ? 'active' : ''}`}
          onClick={onEvaluate}
        >
          {isEvaluating ? '⏸' : '▶'}
          <span>{isEvaluating ? 'Stop' : 'Evaluate'}</span>
        </button>

        <button type="button" className="ne-publish-btn" onClick={onPublish}>
          Publish
        </button>
      </div>
    </header>
  );
};

export default TopBar;
