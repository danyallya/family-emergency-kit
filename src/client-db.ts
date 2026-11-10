import Dexie,{type Table} from 'dexie';
import type {EmergencyChecklistRecord} from './domain/emergency-checklist';
export type OutboxItem={id:string;payload:unknown;createdAt:number;attempts:number;lastError?:string};
export class LocalDatabase extends Dexie {
  outbox!:Table<OutboxItem,string>;
  emergencyChecklists!:Table<EmergencyChecklistRecord,string>;
  constructor(){
    super('idea-family-emergency-kit');
    this.version(1).stores({outbox:'id,createdAt,attempts'});
    this.version(2).stores({outbox:'id,createdAt,attempts',emergencyChecklists:'id,status,updatedAt'});
  }
}
export const localDatabase=new LocalDatabase();
