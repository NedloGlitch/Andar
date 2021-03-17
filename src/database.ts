import { createConnection, Repository } from "typeorm";
import { Users } from './entity/Users';
import { Questions } from './entity/Questions';
import { setUserLocaleToCache } from './cache'

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
    newUser.language = langTransform(user.language);
    newUser.exp = user.exp;
    setUserLocaleToCache(newUser.userId, newUser.language);
    return usersrepos.save(newUser);
}

export const getBotUserByUserId = (userId: number): Promise<Users | undefined> => {
    return usersrepos.findOne(userId);
}

export const getBotUserExp = async (userId: number): Promise<number> => {
    return ((await getBotUserByUserId(userId)) as Users).exp;
}

export async function addUserEXP(userId: number, amount: number) {
    let BotUser = await usersrepos.findOne(userId);
    if(!BotUser) console.log("User was not found")
    else {
        BotUser.exp = BotUser.exp + amount;
        await usersrepos.save(BotUser);
    }
}

export async function getAllUsers() {
    return await usersrepos.find();
}

initialize();

export async function getAllQuizs() {
    return await questionsrepos.find()
}

export async function getCertainQuizs(header:string) {
    return await questionsrepos.find({header:header})
}

function langTransform(language:string) {
    if(language == "🇷🇺\nРусский") return "ru"
    else if(language == "🇺🇸") return "en"
    else if(language == "🇺🇦\nУкраїнська") return "ua"
    else return "en"
}