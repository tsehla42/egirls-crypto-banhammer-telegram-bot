import * as fs from 'fs';

interface Message {
  text?: string | Array<{ type: string; text: string } | string>;
  text_entities?: Array<{ type: string; text: string }>;
  [key: string]: any;
}

interface Data {
  name: string;
  type: string;
  id: number;
  messages: Message[];
}

const data: Data = JSON.parse(fs.readFileSync('./references/result.json', 'utf8'));

const messages = data.messages;

const filtered = messages.filter((msg: Message) => {
  let textStr = '';
  if (Array.isArray(msg.text)) {
    textStr = msg.text.map(part => typeof part === 'string' ? part : part.text).join('');
  } else if (typeof msg.text === 'string') {
    textStr = msg.text;
  }
  return textStr.includes('/addblocklist') && textStr.includes('{ban}');
}).map((msg: Message) => {
  if (msg.text_entities && Array.isArray(msg.text_entities)) {
    const plainEntity = msg.text_entities.find(entity => entity.type === 'plain');
    if (plainEntity) {
      return plainEntity.text;
    }
  }
  return '';
}).filter(text => text !== '');

fs.writeFileSync('./references/cleaned-result.json', JSON.stringify(filtered, null, 2));

console.log('Cleaned messages saved to ../references/cleaned-result.json');