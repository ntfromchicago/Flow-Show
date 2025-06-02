// Flow Show v3
// By Nelson Taruc
// Last updated Oct. 10

// Edited by Katharina Hinschütz
// Last edited May 2025

// This global array keeps track of arrows in the selection
// In the future, this may support non-arrows to change opacity of things connected to arrows
var currentlySelectedArrows: SceneNode[] = [];

// This global array keeps track of the selected flow of the selection
// Other values could be "MIXED" or "NONE"
var currentlySelectedFlow = "NONE";

var minPluginHeight = 256;
var maxPluginHeight = minPluginHeight + 160; // 424

var includeLockedConnectors = false;

figma.showUI(__html__, { themeColors: true });
figma.ui.resize(240, minPluginHeight);

figma.on("run", () => {
  const anArray = retrieveSavedFlowNamesEvenIfThereAreOnlyThreeFlows();
  figma.ui.postMessage({ text: "initialize-flow-names", flowArray: anArray });
  alertIfNoConnectorsExist();
  checkSelectionForConnectors();
})

figma.on("selectionchange", () => {
  checkSelectionForConnectors();
})

function retrieveSavedFlowNamesEvenIfThereAreOnlyThreeFlows() {

  const savedNameArrayString = figma.currentPage.getPluginData('FLOW-SHOW-NAME-ARRAY');
  const savedNameArray = savedNameArrayString.split(",");

  var newArrayToReturn = ["Flow 1", "Flow 2", "Flow 3", "Flow 4", "Flow 5", "Flow 6", "Flow 7", "Flow 8", "Flow 9", "Flow 10"];

  // If we have a list of 10, return
  if (savedNameArray.length == 10) {
    return savedNameArray;
  }

  // If we have a null list, seed it
  if (savedNameArray == null) {
    return newArrayToReturn; 
  }

  // If we have a list that's less than 10, let's loop through the existing savedNameArray

  // First, loop through the savedNameArray
  for (let i = 0; i < savedNameArray.length; i++) {
    if (savedNameArray[i] == '') {
      newArrayToReturn[i] = 'Flow ' + (i + 1);
    } else {
      newArrayToReturn[i] = savedNameArray[i];
    }
  }

  return newArrayToReturn;
}

function alertIfNoConnectorsExist() {
  const nodes = figma.currentPage.findAllWithCriteria({ types: ['CONNECTOR'] });
  if (nodes.length == 0) {
    figma.ui.postMessage({ text: "show-no-connector-alert", currentlySelectedFlow: currentlySelectedFlow });
  }
}

function checkSelectionForConnectors() {
  const aSelection = figma.currentPage.selection;
  currentlySelectedArrows = [];
  var flowArray = [];

  for (let i = 0; i < aSelection.length; i++) {
    const aNode = figma.currentPage.selection[i];

    if (aNode.type as NodeType == 'CONNECTOR') {
      currentlySelectedArrows.push(aNode);
      if (aNode.getPluginData("show-flow") != null && aNode.getPluginData("show-flow") != "") {
        flowArray.push(aNode.getPluginData("show-flow"));
        // console.log("DEBUG FLOW ARRAY: " + flowArray);
      }
    }
  }

  if (currentlySelectedArrows.length > 0) {
    if (flowArray.length > 0) {
      const evaluatedArray = flowArray.every( (val, i, arr) => val === arr[0] );
      if (evaluatedArray == true) {
        currentlySelectedFlow = flowArray[0];
      } else {
        currentlySelectedFlow = "MIXED";
      }
    }
    figma.ui.postMessage({ text: "show-select-tags", currentlySelectedFlow: currentlySelectedFlow });
  } else {
    currentlySelectedFlow = "NONE";
    figma.ui.postMessage({ text: "show-visibility-buttons", currentlySelectedFlow: currentlySelectedFlow });
  }

   //console.log(currentlySelectedArrows.length + " arrows selected, status is " + currentlySelectedFlow + " DEBUG FLOW ARRAY: " + flowArray);
}

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  //console.log("DEBUG: Received message: " + msg.type);

  if (msg.type === 'show-all') {
    toggleConnectorVisibilty(true, "all");
  }

  if (msg.type === 'hide-all') {
    toggleConnectorVisibilty(false, "all");
  }

  if (msg.type === 'show-flow') {
    toggleConnectorVisibilty(msg.show, msg.tag);
  }

  if (msg.type === 'tag-arrows') {
    addTag(currentlySelectedArrows, msg.tag);
  }

  if (msg.type === 'tag-arrows-null') {
    addTag(currentlySelectedArrows, "");
  }

  if (msg.type === 'include-locked-true') {
    includeLockedConnectors = true;
  }

  if (msg.type === 'include-locked-false') {
    includeLockedConnectors = false;
  }

  if (msg.type === 'resize-expand') {
    figma.ui.resize(240, maxPluginHeight);
  }

  if (msg.type === 'resize-collapse') {
    figma.ui.resize(240, minPluginHeight);
  }

  if (msg.type === 'save-flow-names') {
    const nameArrayAsString = msg.nameArray.toString();
    figma.currentPage.setPluginData('FLOW-SHOW-NAME-ARRAY', nameArrayAsString);
  }
  
};

function toggleConnectorVisibilty(visible: boolean, tagStrings: string) {
  const nodes = figma.currentPage.findAllWithCriteria({ types: ['CONNECTOR'] });
  if (tagStrings === "all") {
    // If "all" is passed, we want to show all connectors
    nodes.forEach(node => {
      if (includeLockedConnectors || !node.locked) {
        node.visible = visible;
      }
    });
  } else {
    const tagId = parseInt(tagStrings);
    if (isNaN(tagId) || tagId < 0 || tagId > nodes.length) {
      // If tagStrings is not valid
      console.warn("Invalid tag string provided: " + tagStrings);
      return;
    }

    nodes.forEach(node => {
      if ((includeLockedConnectors || !node.locked) && node.getPluginData("show-flow") == tagStrings) {
        node.visible = visible;
      }
    });
  }
}

function addTag(elements:SceneNode[], tagString:string) {
  for (let i = 0; i < elements.length; i++) {
    const aConnect = elements[i] as ConnectorNode;
    aConnect.setPluginData("show-flow", tagString);
    // console.log(String(aConnect.getPluginData("show-flow")));
  }
}