import { TaskList } from '../../task-list/entities/task-list.entity';
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id!: number;
    @Column()
    title!: string;
    @Column({default: false})
    isCompleted!: boolean;
    @Column({default: 0})
    listPosition!: number;

    @ManyToOne(()=>TaskList, (TaskList)=>TaskList.tasks,{ onDelete: "CASCADE"}) TaskList!: TaskList;

}
