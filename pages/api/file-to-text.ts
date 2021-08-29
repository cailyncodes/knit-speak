// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import convertToText from "../../lib/convert-to-text";
import parseFileData from "../../lib/parse-file-data";
import { PatternSpeechData } from "../../types/knitting";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PatternSpeechData | { error: string }>
) {
  const colorA = req.headers["x-knitspeak-color-a"] as string;
  const colorB = req.headers["x-knitspeak-color-b"] as string;

  try {
    const knittingPattern = parseFileData(req.body);
    const patternSpeechData = convertToText(knittingPattern, colorA, colorB);

    res.status(200).json(patternSpeechData);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
