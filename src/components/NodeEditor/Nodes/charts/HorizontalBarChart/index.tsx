import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WidgetFlowNode } from '../../../workflow/types';
import WidgetNode from '../../common/WidgetNode';

const HorizontalBarChartNode: React.FC<NodeProps<WidgetFlowNode>> = (props) => (
  <WidgetNode {...props} />
);

export default HorizontalBarChartNode;
