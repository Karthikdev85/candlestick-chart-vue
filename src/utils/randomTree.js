export function generateTree() {
  let arr = [1, 2, 3, 4, null, 7, 6, null, null, 5, 9, 8, 10];
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr[0] === null) arr[0] = Math.floor(Math.random());
  if (arr[1] === null && arr[2] === null) {
    if (Math.random() > 0.5) {
      arr[2] = Math.floor(Math.random());
    } else {
      arr[1] = Math.floor(Math.random());
    }
  }
  return arr;
}
