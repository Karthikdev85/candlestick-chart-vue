<script setup>
import { ref, onMounted } from "vue";
import {
  getRequiredHeightAndWidth,
  DEFAULT_CONFIG,
  drawNode,
  connectEdges,
  treeConstructor,
} from "./utils/treeUtils";
import { generateTree } from "./utils/randomTree";
const canvas = ref(null);
const textarea = ref("");

onMounted(() => {
  localGenerate();
});

function drawBinaryTree(root, canvasElement) {
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;
  canvas.value.width = maxWidth;
  canvas.value.height = maxHeight;
  const { requiredCanvasWidth, requiredCanvasHeight } =
    getRequiredHeightAndWidth(root);

  const windowWidthCenter = maxWidth / 2;
  const requiredWidthCenter = requiredCanvasWidth / 2;

  const xStart = windowWidthCenter - requiredWidthCenter;
  const xEnd = windowWidthCenter + requiredWidthCenter;

  const horizontalConfig = { xStart, xEnd };

  // Draw
  recursivelyDrawNodes(root, canvasElement, 0.5, horizontalConfig);
}

function recursivelyDrawNodes(
  root,
  canvasElement,
  currentLevel,
  horizontalConfig
) {
  const { xStart, xEnd } = horizontalConfig;
  const xPos = (xStart + xEnd) / 2;
  const yPos = currentLevel * DEFAULT_CONFIG.nodeHeightSpacing;

  drawNode(root.value, canvasElement.value, xPos, yPos);
  if (root.left !== null) {
    const leftNodeHorizontalConfig = { xStart, xEnd: xPos };
    recursivelyDrawNodes(
      root.left,
      canvasElement,
      currentLevel + 1,
      leftNodeHorizontalConfig
    );
    connectEdges(
      canvasElement.value,
      {
        xStart: xPos,
        xEnd: (xStart + xPos) / 2,
      },
      {
        yStart: yPos + DEFAULT_CONFIG.radius,
        yEnd:
          (currentLevel + 1) * DEFAULT_CONFIG.nodeHeightSpacing -
          DEFAULT_CONFIG.radius,
      }
    );
  }
  if (root.right !== null) {
    const rightNodeHorizontalConfig = { xStart: xPos, xEnd };
    recursivelyDrawNodes(
      root.right,
      canvasElement,
      currentLevel + 1,
      rightNodeHorizontalConfig
    );
    connectEdges(
      canvasElement.value,
      {
        xStart: xPos,
        xEnd: (xPos + xEnd) / 2,
      },
      {
        yStart: yPos + DEFAULT_CONFIG.radius,
        yEnd:
          (currentLevel + 1) * DEFAULT_CONFIG.nodeHeightSpacing -
          DEFAULT_CONFIG.radius,
      }
    );
  }
}

const clearCanvas = () => {
  const context = canvas.value.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
};

let prevValue = ref("");
const initTree = (value) => {
  prevValue.value = value;

  clearCanvas();

  const root = treeConstructor(value);
  drawBinaryTree(root, canvas);
};

const localApply = () => {
  if (textarea.value === "") return;
  initTree(textarea.value);
};

const localClear = () => {
  textarea.value = "";
  clearCanvas();
};

const localGenerate = () => {
  const arr = generateTree();
  const tree = arr
    .map((val) => (val === null ? "null" : val.toString()))
    .join(",");
  textarea.value = tree;
  initTree(tree);
};
</script>

<template>
  <div class="inputContainer">
    <textarea class="input" rows="5" v-model="textarea"></textarea>
    <div class="actionBtns">
      <button class="applyBtn" @click="localApply()">Apply</button>
      <button class="clearBtn" @click="localClear()">Clear</button>
    </div>
    <button class="generateBtn" @click="localGenerate()">
      Generate Random Tree
    </button>
  </div>
  <canvas ref="canvas"></canvas>
</template>
