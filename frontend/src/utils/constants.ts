import { SampleBoxStatus, BoxSplitStatus, TemperatureReviewConclusion } from './enums';

export const SampleBoxStatusLabels: Record<SampleBoxStatus, string> = {
  [SampleBoxStatus.DRAFT]: '草稿',
  [SampleBoxStatus.REGISTERED]: '已登记',
  [SampleBoxStatus.PENDING_EXPORT_APPROVAL]: '待出境审批',
  [SampleBoxStatus.EXPORT_APPROVED]: '出境审批通过',
  [SampleBoxStatus.EXPORT_REJECTED]: '出境申请驳回',
  [SampleBoxStatus.EXPORTED]: '已出境',
  [SampleBoxStatus.IN_TRANSIT]: '运输中',
  [SampleBoxStatus.ARRIVED]: '已到样待确认',
  [SampleBoxStatus.TEMP_NORMAL]: '温度正常',
  [SampleBoxStatus.TEMP_ABNORMAL]: '温度异常',
  [SampleBoxStatus.FROZEN]: '已冻结',
  [SampleBoxStatus.THAWED]: '已解冻',
  [SampleBoxStatus.DESTROYED]: '已销毁',
};

export const SampleBoxStatusColors: Record<SampleBoxStatus, string> = {
  [SampleBoxStatus.DRAFT]: 'default',
  [SampleBoxStatus.REGISTERED]: 'blue',
  [SampleBoxStatus.PENDING_EXPORT_APPROVAL]: 'gold',
  [SampleBoxStatus.EXPORT_APPROVED]: 'green',
  [SampleBoxStatus.EXPORT_REJECTED]: 'red',
  [SampleBoxStatus.EXPORTED]: 'purple',
  [SampleBoxStatus.IN_TRANSIT]: 'cyan',
  [SampleBoxStatus.ARRIVED]: 'blue',
  [SampleBoxStatus.TEMP_NORMAL]: 'green',
  [SampleBoxStatus.TEMP_ABNORMAL]: 'gold',
  [SampleBoxStatus.FROZEN]: 'red',
  [SampleBoxStatus.THAWED]: 'green',
  [SampleBoxStatus.DESTROYED]: 'default',
};

export const DocumentTypeLabels: Record<string, string> = {
  ethics_approval: '伦理批件',
  customs_declaration: '报关单',
  biological_sample_permit: '生物样本许可',
  shipping_invoice: '运输发票',
  packing_list: '装箱单',
  health_certificate: '卫生证书',
};

export const DocumentStatusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  verified: '已核验',
  expired: '已过期',
};

export const FreezeReasonLabels: Record<string, string> = {
  temp_exceeded: '温度超限',
  flight_delay: '航班延误',
  other: '其他原因',
};

export const ApprovalStatusLabels: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
};

export const FlightStatusLabels: Record<string, string> = {
  scheduled: '计划中',
  boarding: '登机中',
  departed: '已起飞',
  in_flight: '飞行中',
  landed: '已降落',
  arrived: '已到达',
  cancelled: '已取消',
};

export const BoxSplitStatusLabels: Record<BoxSplitStatus, string> = {
  [BoxSplitStatus.PENDING]: '进行中',
  [BoxSplitStatus.COMPLETED]: '已完成',
  [BoxSplitStatus.CANCELLED]: '已取消',
};

export const TemperatureReviewConclusionLabels: Record<TemperatureReviewConclusion, string> = {
  [TemperatureReviewConclusion.PENDING]: '待复核',
  [TemperatureReviewConclusion.USABLE]: '可用',
  [TemperatureReviewConclusion.UNUSABLE]: '不可用',
};

export const TemperatureReviewConclusionColors: Record<TemperatureReviewConclusion, string> = {
  [TemperatureReviewConclusion.PENDING]: 'gold',
  [TemperatureReviewConclusion.USABLE]: 'green',
  [TemperatureReviewConclusion.UNUSABLE]: 'red',
};

export const FlightChangeTypeLabels: Record<string, string> = {
  reschedule: '改签',
  reroute: '改航线',
  cancel: '取消',
};

export const SplitTypeLabels: Record<string, string> = {
  by_count: '按数量分箱',
  by_type: '按类型分箱',
  manual: '手动分箱',
};

export const formatTemperature = (temp: number | null | undefined): string => {
  if (temp === null || temp === undefined || isNaN(Number(temp))) return '-';
  return `${Number(temp).toFixed(2)}°C`;
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDateOnly = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const FLOW_NODE_DEFINITIONS = [
  { key: SampleBoxStatus.DRAFT, label: '草稿', color: '#d9d9d9', role: '研究中心', order: 1 },
  { key: SampleBoxStatus.REGISTERED, label: '已登记', color: '#1890ff', role: '研究中心', order: 2 },
  { key: SampleBoxStatus.PENDING_EXPORT_APPROVAL, label: '待出境审批', color: '#faad14', role: '管理员', order: 3 },
  { key: SampleBoxStatus.EXPORT_APPROVED, label: '审批通过', color: '#52c41a', role: '管理员', order: 4 },
  { key: SampleBoxStatus.EXPORTED, label: '已出境', color: '#722ed1', role: '报关专员', order: 5 },
  { key: SampleBoxStatus.IN_TRANSIT, label: '运输中', color: '#13c2c2', role: '报关专员', order: 6 },
  { key: SampleBoxStatus.ARRIVED, label: '已到样', color: '#1890ff', role: '中心实验室', order: 7 },
  { key: SampleBoxStatus.TEMP_NORMAL, label: '温度正常', color: '#52c41a', role: '中心实验室', order: 8 },
  { key: SampleBoxStatus.FROZEN, label: '已冻结', color: '#ff4d4f', role: '中心实验室', order: 9 },
];
