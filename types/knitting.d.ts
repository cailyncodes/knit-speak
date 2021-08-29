export type Type = "start" | "row-start" | "stitch" | "row-end" | "end";
export type Action = "knit" | "purl";

export type Color = "A" | "B";

export type KnittingAction = {
  type: Type;
  action?: Action;
  color?: Color;
};

export type KnittingRow = {
  rowNumber: number;
  actions: KnittingAction[];
};

export type KnittingPattern = KnittingRow[];

export type TextLine = {
  type: Type;
  displayText: string;
  speechText: string;
};

export type PatternSpeechData = {
  text: TextLine[];
};
