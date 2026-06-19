export enum UserRole {
  RESEARCH_CENTER = 'research_center',
  CUSTOMS_OFFICER = 'customs_officer',
  CENTRAL_LAB = 'central_lab',
  ADMIN = 'admin',
}

export enum SampleBoxStatus {
  DRAFT = 'draft',
  REGISTERED = 'registered',
  PENDING_EXPORT_APPROVAL = 'pending_export_approval',
  EXPORT_APPROVED = 'export_approved',
  EXPORT_REJECTED = 'export_rejected',
  EXPORTED = 'exported',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  TEMP_NORMAL = 'temp_normal',
  TEMP_ABNORMAL = 'temp_abnormal',
  FROZEN = 'frozen',
  THAWED = 'thawed',
  DESTROYED = 'destroyed',
}

export enum DocumentType {
  ETHICS_APPROVAL = 'ethics_approval',
  CUSTOMS_DECLARATION = 'customs_declaration',
  BIOLOGICAL_SAMPLE_PERMIT = 'biological_sample_permit',
  SHIPPING_INVOICE = 'shipping_invoice',
  PACKING_LIST = 'packing_list',
  HEALTH_CERTIFICATE = 'health_certificate',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}

export enum FreezeReason {
  TEMP_EXCEEDED = 'temp_exceeded',
  FLIGHT_DELAY = 'flight_delay',
  OTHER = 'other',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ApprovalType {
  EXPORT = 'export',
  FREEZE = 'freeze',
  THAW = 'thaw',
  DESTROY = 'destroy',
}

export const SAMPLE_FLOW_NODES = [
  { key: SampleBoxStatus.DRAFT, label: '草稿', role: UserRole.RESEARCH_CENTER },
  { key: SampleBoxStatus.REGISTERED, label: '已登记', role: UserRole.RESEARCH_CENTER },
  { key: SampleBoxStatus.PENDING_EXPORT_APPROVAL, label: '待出境审批', role: UserRole.ADMIN },
  { key: SampleBoxStatus.EXPORT_APPROVED, label: '出境审批通过', role: UserRole.ADMIN },
  { key: SampleBoxStatus.EXPORTED, label: '已出境', role: UserRole.CUSTOMS_OFFICER },
  { key: SampleBoxStatus.IN_TRANSIT, label: '运输中', role: UserRole.CUSTOMS_OFFICER },
  { key: SampleBoxStatus.ARRIVED, label: '已到样', role: UserRole.CENTRAL_LAB },
  { key: SampleBoxStatus.TEMP_NORMAL, label: '温度正常', role: UserRole.CENTRAL_LAB },
  { key: SampleBoxStatus.FROZEN, label: '已冻结', role: UserRole.CENTRAL_LAB },
];
