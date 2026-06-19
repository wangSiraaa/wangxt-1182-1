import { User } from './User';
import { SampleBox } from './SampleBox';
import { Document } from './Document';
import { Flight } from './Flight';
import { TemperatureRecord } from './TemperatureRecord';
import { FreezeRecord } from './FreezeRecord';
import { ApprovalRecord } from './ApprovalRecord';
import { FlowLog } from './FlowLog';

export const setupAssociations = () => {
  SampleBox.hasMany(Document, {
    foreignKey: 'sampleBoxId',
    as: 'documents',
  });
  Document.belongsTo(SampleBox, {
    foreignKey: 'sampleBoxId',
    as: 'sampleBox',
  });

  SampleBox.hasMany(TemperatureRecord, {
    foreignKey: 'sampleBoxId',
    as: 'temperatureRecords',
  });
  TemperatureRecord.belongsTo(SampleBox, {
    foreignKey: 'sampleBoxId',
    as: 'sampleBox',
  });

  SampleBox.hasMany(FreezeRecord, {
    foreignKey: 'sampleBoxId',
    as: 'freezeRecords',
  });
  FreezeRecord.belongsTo(SampleBox, {
    foreignKey: 'sampleBoxId',
    as: 'sampleBox',
  });

  SampleBox.hasMany(FlowLog, {
    foreignKey: 'sampleBoxId',
    as: 'flowLogs',
    onDelete: 'CASCADE',
  });
  FlowLog.belongsTo(SampleBox, {
    foreignKey: 'sampleBoxId',
    as: 'sampleBox',
  });

  FreezeRecord.belongsTo(TemperatureRecord, {
    foreignKey: 'triggeredByTemperatureRecordId',
    as: 'triggerTemperature',
  });

  FreezeRecord.belongsTo(Flight, {
    foreignKey: 'triggeredByFlightId',
    as: 'triggerFlight',
  });
};

export {
  User,
  SampleBox,
  Document,
  Flight,
  TemperatureRecord,
  FreezeRecord,
  ApprovalRecord,
  FlowLog,
};
