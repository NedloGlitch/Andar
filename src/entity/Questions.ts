//import { text } from "telegraf/typings/button";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Questions {
    
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        charset: 'utf8mb4',
        collation: 'utf8_general_ci',
      })
    header!: string;

    @Column({
        charset: 'utf8mb4',
        collation: 'utf8_general_ci',
      })
    description!: string;

    @Column({
        charset: 'utf8mb4',
        collation: 'utf8_general_ci',
        type: 'text',
        nullable: true})
    answer!: string | null;

    @Column({
        charset: 'utf8mb4',
        collation: 'utf8_general_ci',
      })
    correctAnswer!: string;
    
}
