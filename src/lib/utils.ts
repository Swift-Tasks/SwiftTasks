import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(length: number = 35) {
  let str = "QWERTYUIOASDFGHJKLZXCVBNMqwertyuioasdfghjklzxcvbnm1234567890---";
  let chars = "";
  for (let i = 0; i < length; i++) {
    chars += str[Math.floor(Math.random() * str.length)];
  }
  return chars;
}
