import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Questions {
    
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    header!: string;

    @Column()
    description!: string;

    @Column()
    answers!: string;

    @Column()
    correctAnswer!: string;
}
