import { SampleBox, FlowLog, User } from '../models';
import { SampleBoxStatus, UserRole, SAMPLE_FLOW_NODES } from '../types/enums';
import { BusinessError } from '../middleware/validation';

export interface FlowTransition {
  from?: SampleBoxStatus;
  to: SampleBoxStatus;
  allowedRoles: UserRole[];
  operationType: string;
  description: string;
  checkRules?: (sampleBox: SampleBox, context?: any) => Promise<void>;
}

const transitions: FlowTransition[] = [
  {
    to: SampleBoxStatus.REGISTERED,
    allowedRoles: [UserRole.RESEARCH_CENTER, UserRole.ADMIN],
    operationType: 'register',
    description: '登记样本盒',
  },
  {
    from: SampleBoxStatus.REGISTERED,
    to: SampleBoxStatus.PENDING_EXPORT_APPROVAL,
    allowedRoles: [UserRole.RESEARCH_CENTER, UserRole.ADMIN],
    operationType: 'submit_export',
    description: '提交出境审批',
    checkRules: async (sampleBox) => {
      if (!sampleBox.ethicsApprovalNo || !sampleBox.ethicsApprovalVerified) {
        throw new BusinessError('伦理批件缺失或未核验，无法提交出境申请');
      }
      if (sampleBox.ethicsApprovalValidUntil && new Date(sampleBox.ethicsApprovalValidUntil) < new Date()) {
        throw new BusinessError('伦理批件已过期，无法提交出境申请');
      }
    },
  },
  {
    from: SampleBoxStatus.PENDING_EXPORT_APPROVAL,
    to: SampleBoxStatus.EXPORT_APPROVED,
    allowedRoles: [UserRole.ADMIN],
    operationType: 'approve_export',
    description: '审批通过出境',
  },
  {
    from: SampleBoxStatus.PENDING_EXPORT_APPROVAL,
    to: SampleBoxStatus.REGISTERED,
    allowedRoles: [UserRole.ADMIN],
    operationType: 'reject_export',
    description: '驳回出境申请',
  },
  {
    from: SampleBoxStatus.EXPORT_APPROVED,
    to: SampleBoxStatus.EXPORTED,
    allowedRoles: [UserRole.CUSTOMS_OFFICER, UserRole.ADMIN],
    operationType: 'confirm_export',
    description: '确认出境',
  },
  {
    from: SampleBoxStatus.EXPORTED,
    to: SampleBoxStatus.IN_TRANSIT,
    allowedRoles: [UserRole.CUSTOMS_OFFICER, UserRole.ADMIN],
    operationType: 'start_transit',
    description: '开始运输',
  },
  {
    from: SampleBoxStatus.IN_TRANSIT,
    to: SampleBoxStatus.ARRIVED,
    allowedRoles: [UserRole.CENTRAL_LAB, UserRole.ADMIN],
    operationType: 'confirm_arrival',
    description: '确认到样',
  },
  {
    from: SampleBoxStatus.ARRIVED,
    to: SampleBoxStatus.TEMP_NORMAL,
    allowedRoles: [UserRole.CENTRAL_LAB, UserRole.ADMIN],
    operationType: 'confirm_temp_normal',
    description: '温度确认正常',
    checkRules: async (sampleBox) => {
      if (sampleBox.currentTemp != null) {
        if (sampleBox.minTemp != null && Number(sampleBox.currentTemp) < Number(sampleBox.minTemp)) {
          throw new BusinessError('当前温度低于最低温度限制，不能标记为正常');
        }
        if (sampleBox.maxTemp != null && Number(sampleBox.currentTemp) > Number(sampleBox.maxTemp)) {
          throw new BusinessError('当前温度高于最高温度限制，不能标记为正常');
        }
      }
    },
  },
  {
    from: SampleBoxStatus.ARRIVED,
    to: SampleBoxStatus.TEMP_ABNORMAL,
    allowedRoles: [UserRole.CENTRAL_LAB, UserRole.ADMIN],
    operationType: 'confirm_temp_abnormal',
    description: '温度确认异常',
  },
  {
    to: SampleBoxStatus.FROZEN,
    allowedRoles: [UserRole.CENTRAL_LAB, UserRole.ADMIN],
    operationType: 'freeze',
    description: '冻结样本盒',
  },
  {
    from: SampleBoxStatus.FROZEN,
    to: SampleBoxStatus.THAWED,
    allowedRoles: [UserRole.CENTRAL_LAB, UserRole.ADMIN],
    operationType: 'thaw',
    description: '解冻样本盒',
  },
  {
    from: SampleBoxStatus.FROZEN,
    to: SampleBoxStatus.DESTROYED,
    allowedRoles: [UserRole.CENTRAL_LAB, UserRole.ADMIN],
    operationType: 'destroy',
    description: '销毁样本盒',
  },
];

export const findTransition = (
  fromStatus: SampleBoxStatus | undefined,
  toStatus: SampleBoxStatus,
  role: UserRole
): FlowTransition | undefined => {
  return transitions.find((t) => {
    const fromMatch = t.from === undefined || t.from === fromStatus;
    const roleMatch = t.allowedRoles.includes(role);
    return t.to === toStatus && fromMatch && roleMatch;
  });
};

export const executeTransition = async (
  sampleBoxId: string,
  toStatus: SampleBoxStatus,
  userId: string,
  userName: string,
  userRole: UserRole,
  context?: any
): Promise<SampleBox> => {
  const sampleBox = await SampleBox.findByPk(sampleBoxId);
  if (!sampleBox) {
    throw new BusinessError('样本盒不存在');
  }

  const fromStatus = sampleBox.status as SampleBoxStatus;
  const transition = findTransition(fromStatus, toStatus, userRole);

  if (!transition) {
    throw new BusinessError(
      `不允许从【${fromStatus}】流转到【${toStatus}】，或当前角色【${userRole}】无权限执行此操作`
    );
  }

  if (transition.checkRules) {
    await transition.checkRules(sampleBox, context);
  }

  if (toStatus === SampleBoxStatus.TEMP_NORMAL || toStatus === SampleBoxStatus.TEMP_ABNORMAL || toStatus === SampleBoxStatus.ARRIVED) {
    sampleBox.subjectCodeLocked = true;
    sampleBox.tempConfirmedAt = new Date();
  }

  if (toStatus === SampleBoxStatus.EXPORTED) {
    sampleBox.exportedAt = new Date();
  }

  if (toStatus === SampleBoxStatus.ARRIVED) {
    sampleBox.arrivedAt = new Date();
  }

  sampleBox.status = toStatus;
  await sampleBox.save();

  await FlowLog.create({
    sampleBoxId,
    fromStatus,
    toStatus,
    operatorId: userId,
    operatorName: userName,
    operatorRole: userRole,
    operationType: transition.operationType,
    description: transition.description,
    remark: context?.remark,
  });

  return sampleBox;
};

export const canUpdateSubjectCode = (sampleBox: SampleBox): boolean => {
  return !sampleBox.subjectCodeLocked;
};

export const getNodeLabel = (status: SampleBoxStatus): string => {
  const node = SAMPLE_FLOW_NODES.find((n) => n.key === status);
  return node ? node.label : status;
};

export const getAvailableTransitions = (
  currentStatus: SampleBoxStatus,
  userRole: UserRole
): FlowTransition[] => {
  return transitions.filter((t) => {
    const fromMatch = t.from === undefined || t.from === currentStatus;
    const roleMatch = t.allowedRoles.includes(userRole);
    return fromMatch && roleMatch && t.to !== currentStatus;
  });
};
