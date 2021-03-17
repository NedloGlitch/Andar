//import { text } from "telegraf/typings/button";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Questions {
    
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    header!: string;

    @Column()
    description!: string;

    @Column({
        type: 'text',
        nullable: true})
    answer!: string | null;

    @Column()
    correctAnswer!: string;
    
}
