import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn} from "typeorm";
import { Locale } from "../i18n";

@Entity()
export class Users {
    
    /*@PrimaryGeneratedColumn()
    id!: number;*/

    @PrimaryColumn()
    userId!: number;

    @Column()
    language!: Locale;

    @Column()
    exp!: number;
}
