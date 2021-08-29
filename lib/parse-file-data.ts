import {
  Action,
  Color,
  KnittingAction,
  KnittingPattern,
} from "../types/knitting";

export default function parseFileData(fileData: string): KnittingPattern {
  const rowsData = fileData.split(new RegExp(/[\n\r]+/)).filter((row) => row);
  const inverseRowsData = [...rowsData].reverse();
  const cellsData = inverseRowsData.map((inverseRowData) =>
    inverseRowData.split(",")
  );

  const processedCellsData = cellsData.map((cellRowData) => {
    if (cellRowData[0] === "") {
      return processRightToLeftRow(cellRowData);
    } else if (cellRowData[cellRowData.length - 1] === "") {
      return processLeftToRightRow(cellRowData);
    } else {
      throw new Error("unrecognized CSV format");
    }
  });

  return processedCellsData;
}

const processRightToLeftRow = (rowData: string[]) => {
  return processLeftToRightRow([...rowData].reverse());
};

const processLeftToRightRow = (rowData: string[]) => {
  const filteredRowData = rowData.filter((cell) => cell);
  const rowNumber = parseInt(filteredRowData[0]);
  const startAction: KnittingAction = {
    type: "row-start",
  };

  const actions = filteredRowData.slice(1).map<KnittingAction>((cell) => {
    if (cell.length !== 2) {
      throw new Error("unrecognized CSV format");
    }

    const action = getAction(cell[0].toLowerCase());
    const color = getColor(cell[1]);
    return {
      type: "stitch",
      action,
      color,
    };
  });

  const endAction: KnittingAction = {
    type: "row-end",
  };

  return {
    rowNumber,
    actions: [startAction, ...actions, endAction],
  };
};

const getAction = (actionEncoding: string): Action => {
  switch (actionEncoding) {
    case "k":
      return "knit";
    case "p":
      return "purl";
    default:
      throw new Error("unrecognized CSV format");
  }
};

const getColor = (colorEncoding: string): Color => {
  switch (colorEncoding) {
    case "a":
      return "A";
    case "b":
      return "B";
    default:
      throw new Error("unrecognized CSV format");
  }
};
