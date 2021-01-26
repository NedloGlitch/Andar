import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { getPhrase} from './i18n'; //Locale provider


export async function menuKeyboard(userId: number) {
  return templet(
    [   
      [await getPhrase("anket", userId)],
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

export async function testKeyboard(userId: number) {
  return templet(
    [   
      ["Useless Button"],
      [await getPhrase("takeTest", userId)],
      [await getPhrase("mylvl", userId), await getPhrase("anket", userId)],
      [await getPhrase("menu", userId)] 
    ]
    );
}

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