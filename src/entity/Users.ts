import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Users {
    
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    news!: boolean;

    @Column()
    language!: string;
}
