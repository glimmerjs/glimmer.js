const add = (a, b) => { 
  return a + b;
}

export default function(numbers) {
  return numbers.reduce(add);
}