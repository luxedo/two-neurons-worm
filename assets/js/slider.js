let sliders = document.getElementsByClassName("slider");
Array.from(sliders).forEach(slider => {
  let numberInput = document.createElement("input");
  numberInput.setAttribute("type", "number");
  numberInput.setAttribute("value", slider.value);
  numberInput.setAttribute("min", slider.min);
  numberInput.setAttribute("max", slider.max);
  numberInput.setAttribute("step", slider.step || "1");
  numberInput.setAttribute("size", "5");
  slider.parentNode.appendChild(numberInput);
  slider.oninput = () => numberInput.value = slider.value;
  numberInput.onchange = () => {
    let value = parseFloat(numberInput.value);
    value = value>slider.max?slider.max:value;
    value = value<slider.min?slider.min:value;
    slider.value = numberInput.value = value;
  };
});
