import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { getPhrase} from './i18n'; //Locale provider


export async function menuKeyboard(userId: number) {
  return templet(
    [   
      [await getPhrase("contact", userId)],
      [await getPhrase("takeTest", userId)],
      [await getPhrase("mylvl", userId)]
    ]
    );
}

export async function returnKeyboard(userId: number) {
  return templet(
    [ 
      [await getPhrase("menu", userId)] 
    ]
    );
}

export async function adminKeyboard(userId: number){
  return templet(
  [
    [await getPhrase("sendNews", userId)],
    [await getPhrase("deleteTest", userId), await getPhrase("editTest", userId), await getPhrase("makeTest", userId)],
    [await getPhrase("menu", userId)]
  ]
  );
}

export async function answerKeyboard(userId: number, answer:string) {
  let temp = answer.split(";")
  let temp2:string[][] = [];
  for(let i=0;i<temp.length;i++){
    temp2.push([temp[i]])
  }
  temp2.push([await getPhrase("menu", userId)])
  return templet(temp2);
}

export async function languageKeyboard(userId: number) {
  return templet(
    [
      ["Русский"],
      ["Українська"],
      [await getPhrase("noLimit", userId)],
      [await getPhrase("menu", userId)]
    ]
  );
}
  
export async function denyKeyboard(userId: number) {
  return templet(
    [
      [await getPhrase("noLimit", userId)],
      [await getPhrase("menu", userId)]
    ]
  );
}

export async function addKeyboard(userId: number) {
  return templet(
    [
      [await getPhrase("newName", userId)],
      [await getPhrase("editBasis", userId)],
      [await getPhrase("addQuestion", userId)],
      [await getPhrase("menu", userId)]
    ]
  );
}
  
/*export async function deleteQuizKeyboard(userId: number) {
  return templet(
    [ 
      [await getPhrase("deleteTest", userId) + " " + await getPhrase("chosenQuiz", userId)],
      [await getPhrase("menu", userId)] 
    ]
    );
}*/

function templet(buttons:string[][]){
  let tempboard: ExtraReplyMessage = {
    reply_markup: {
      keyboard:  
          buttons
        ,
      resize_keyboard: true,
    }
  }
  return tempboard
}


/*export async function testKeyboard(userId: number) {
  let tempboard: ExtraReplyMessage = {
    reply_markup: {
      keyboard: 
      resize_keyboard: true,
    }
  }
  return tempboard;
}*/

/*export async function menuKeyboard(userId: number) {
  let tempboard: ExtraReplyMessage = {
    reply_markup: {
      keyboard: [   
          [await getPhrase("anket", userId)],
          [await getPhrase("takeTest", userId)],
          [await getPhrase("mylvl", userId)]
        ],
      resize_keyboard: true,
    }
  }
  return tempboard;
}*/
