
import { GoogleGenAI } from "@google/genai";
import { Era } from './types';

// Proteção para evitar crash no GitHub Pages se process.env não estiver definido
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getEraDescription = async (era: Era): Promise<string> => {
  if (!ai) return `A humanidade avança para a ${era}.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é o narrador de um jogo de evolução. Descreva brevemente (1 frase impactante) a transição para a era: ${era}. Seja épico e poético.`,
    });
    return response.text?.trim() || `Bem-vindo à ${era}.`;
  } catch (error) {
    console.error(error);
    return `A humanidade avança para a ${era}.`;
  }
};

export const getRandomEvent = async (era: Era, resources: string): Promise<string> => {
  if (!ai) return "Um dia calmo passa na história.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O jogador está na era ${era}. Recursos atuais: ${resources}. Crie um micro-evento aleatório de uma frase (pode ser bom ou neutro) que aconteceu na tribo/civilização. Não peça ação do jogador, apenas narre.`,
    });
    return response.text?.trim() || "O vento sopra forte entre as árvores.";
  } catch (error) {
    console.error(error);
    return "Um dia calmo passa na história.";
  }
};
