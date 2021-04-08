//import { text } from "telegraf/typings/button";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Questions {
    
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        charset: 'utf8mb4',
      })
    header!: string;

    @Column({
        charset: 'utf8mb4',
      })
    description!: string;

    @Column({
        charset: 'utf8mb4',
        type: 'text',
        nullable: true})
    answer!: string | null;

    @Column({
        charset: 'utf8mb4',
      })
    correctAnswer!: string;
    
}
