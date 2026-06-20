import { User } from './User';
import { SampleBox } from './SampleBox';
import { Document } from './Document';
import { Flight } from './Flight';
import { TemperatureRecord } from './TemperatureRecord';
import { FreezeRecord } from './FreezeRecord';
import { ApprovalRecord } from './ApprovalRecord';
import { FlowLog } from './FlowLog';
import { SampleTube } from './SampleTube';
import { BoxSplitRecord } from './BoxSplitRecord';
import { FlightChangeRecord } from './FlightChangeRecord';
import { TemperatureReview } from './TemperatureReview';

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

  SampleBox.hasMany(SampleTube, {
    foreignKey: 'sampleBoxId',
    as: 'sampleTubes',
  });
  SampleTube.belongsTo(SampleBox, {
    foreignKey: 'sampleBoxId',
    as: 'sampleBox',
  });

  SampleTube.belongsTo(SampleBox, {
    foreignKey: 'originalSampleBoxId',
    as: 'originalSampleBox',
  });

  SampleTube.belongsTo(BoxSplitRecord, {
    foreignKey: 'boxSplitRecordId',
    as: 'boxSplitRecord',
  });

  BoxSplitRecord.hasMany(SampleTube, {
    foreignKey: 'boxSplitRecordId',
    as: 'tubes',
  });

  Flight.hasMany(FlightChangeRecord, {
    foreignKey: 'flightId',
    as: 'changeRecords',
  });
  FlightChangeRecord.belongsTo(Flight, {
    foreignKey: 'flightId',
    as: 'flight',
  });

  TemperatureReview.belongsTo(SampleBox, {
    foreignKey: 'sampleBoxId',
    as: 'sampleBox',
  });

  SampleBox.hasMany(TemperatureReview, {
    foreignKey: 'sampleBoxId',
    as: 'temperatureReviews',
  });

  TemperatureReview.belongsTo(FreezeRecord, {
    foreignKey: 'freezeRecordId',
    as: 'freezeRecord',
  });

  FreezeRecord.hasMany(TemperatureReview, {
    foreignKey: 'freezeRecordId',
    as: 'reviews',
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
  SampleTube,
  BoxSplitRecord,
  FlightChangeRecord,
  TemperatureReview,
};
