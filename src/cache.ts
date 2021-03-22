//import { createClient, print } from 'redis';

//import { fchmod } from "fs/promises";
import { getCertainQuiz } from "./database";
import { Locale } from "./i18n";
//const client = createClient();

//USER LOCALE STORAGE

const localeStorage = new Map<number, Locale>()


export const setUserLocaleToCache = (userId: number, locale: Locale) => {
    localeStorage.set(userId, locale)
}

export const getUserLocaleFromCache = (userId: number): Locale | undefined => localeStorage.get(userId)

export const flushCache = () => {
    localeStorage.clear()
}

setInterval(() => {
    flushCache();
}, 24 * 60 * 60 * 1000);


// -USER ANSWERS STORAGE-
//This bit is used to store strings for a specific user
const stringStorage = new Map<number, string[]>()

export const setStoredString = (userId: number, answer: string) => {
    let stringArray = getStoredString(userId) //GET STORED STRINGS FROM MEMORY
    if(!stringArray)
        stringStorage.set(userId, [answer])
    else {
        stringArray.push(answer)
        stringStorage.set(userId, stringArray)
    }
}

export const getStoredString = (userId: number): string[] | undefined => stringStorage.get(userId)
export const emptyStoredString = (userId:number) => stringStorage.set(userId, [])


const questionStorage = new Map<number, string[]>()

export const setStoredQuestion = async(userId: number, header: string) => {
    let dataArray = await getCertainQuiz(header)
    let questionArray:string[] = []
    for(let i = 1; i<dataArray.length; i++) //Add questions
        questionArray.push(dataArray[i].description)
    for(let i = 1; i<dataArray.length; i++) //Add answers
        if(!dataArray[i].answer)
            questionArray.push("-No Answers-")
        else
            questionArray.push(dataArray[i].answer as string)
    for(let i = 1; i<dataArray.length; i++) //Add correctAnswers
        questionArray.push(dataArray[i].correctAnswer)
    questionStorage.set(userId, questionArray)
}

export const getAllQuestionStored = (userId: number): string[]=> {
    let questions = questionStorage.get(userId)
    if(!questions)
        return ["GetAllQuestions error"]
    else
        return questions
}

export const emptyStoredQuestion = (userId:number) => questionStorage.set(userId, [])



/*export const getQuestionStored = (userId: number, position: number): string => {
    if(!(questionStorage.get(userId) as string[])[position]){
        return "NO QUESTION ERROR"
    }
    else {
        return (questionStorage.get(userId) as string[])[position]
    }
}*/