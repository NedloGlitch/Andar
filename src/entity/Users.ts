import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn} from "typeorm";
import { Locale } from "../i18n";

@Entity()
export class Users {
    
    /*@PrimaryGeneratedColumn()
    id!: number;*/

    @PrimaryColumn()
    userId!: number;

    @Column()
    news!: boolean;

    @Column()
    language!: Locale;

    @Column()
    exp!: number;
}
