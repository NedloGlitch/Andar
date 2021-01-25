import { createConnection, Repository } from "typeorm";
import { Users } from './entity/Users';
import { Questions } from './entity/Questions';

let usersrepos : Repository<Users>;
let questionsrepos : Repository<Questions>;

const initialize = async () => {
    const connection = await createConnection({
        type: "sqlite",
        database: "database.db",
        entities: [Users, Questions],
        synchronize: true,
        logging: false,
    })
    usersrepos = connection.getRepository(Users);
    questionsrepos = connection.getRepository(Questions);
}

export const createBotUser = (user: Users): Promise<Users> => {
        const newUser = new Users();
        newUser.userId = user.userId;
        newUser.news = user.news;
        newUser.language = langTransform(user.language);
        newUser.exp = user.exp;
    return usersrepos.save(newUser);
}

export const getBotUserByUserId = (userId: number): Promise<Users | undefined> => {
    return usersrepos.findOne(userId);
}

export async function addUserEXP(userId: number, amount: number) {
    let BotUser = await usersrepos.findOne(userId);
    if(!BotUser) console.log("User was not found")
    else {
        BotUser.exp = BotUser.exp + amount;
        await usersrepos.save(BotUser);
    }
}

initialize();

function langTransform(language:string) {
    if(language == "🇷🇺") return "ru"
    else if(language == "🇺🇸") return "en"
    else return "en"
}