import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WidgetFlowNode } from '../../../../frontEndUtilities/types';
import WidgetNode from '../../common/WidgetNode';

const CalculateNode: React.FC<NodeProps<WidgetFlowNode>> = (props) => (
  <WidgetNode {...props} />
);

export default CalculateNode;
