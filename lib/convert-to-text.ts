import {
  Action,
  Color,
  KnittingPattern,
  PatternSpeechData,
  TextLine,
} from "../types/knitting";

export default function convertToText(
  knittingPattern: KnittingPattern,
  colorA: string,
  colorB: string
): PatternSpeechData {
  const startText: TextLine = {
    type: "start",
    displayText: "Start piece",
    speechText: "Start",
  };

  const text = knittingPattern.map<TextLine[]>((knittingRow) => {
    return knittingRow.actions.map<TextLine>((knittingAction, i) => {
      if (knittingAction.type === "row-start") {
        return {
          type: "row-start",
          displayText: `Start Row ${knittingRow.rowNumber}`,
          speechText: `Start row ${knittingRow.rowNumber}`,
        };
      }
      if (knittingAction.type === "stitch") {
        return {
          type: knittingAction.type,
          displayText: `Stitch ${i}: ${getAction(
            knittingAction.action as Action
          )} ${getColor(knittingAction.color as Color, colorA, colorB)}`,
          speechText: `${getAction(knittingAction.action as Action)} ${getColor(
            knittingAction.color as Color,
            colorA,
            colorB
          )}`,
        };
      }
      if (knittingAction.type === "row-end") {
        return {
          type: "row-end",
          displayText: `End Row ${knittingRow.rowNumber}`,
          speechText: `End row ${knittingRow.rowNumber}`,
        };
      }
      throw new Error();
    });
  });

  const endText: TextLine = {
    type: "end",
    displayText: "End piece (You finished!)",
    speechText: "You finished",
  };

  return { text: [startText, ...text.flat(), endText] };
}

const getAction = (action: Action) => {
  return {
    knit: "Knit",
    purl: "Purl",
  }[action];
};

const getColor = (color: Color, colorA: string, colorB: string) => {
  return {
    A: colorA,
    B: colorB,
  }[color];
};
