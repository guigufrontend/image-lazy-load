
// const images = Array.from(document.getElementsByTagName('img'));

// function loadImg(){
//     images.forEach(img=>{
//         const { top, bottom } = img.getBoundingClientRect()
//         if(top<window.innerHeight&&bottom>0){
//             delayJudge(img)
//             // img.src = img.dataset.src
//         }
//     })
// }
// function delayJudge(img){
//     setTimeout(()=>{
//         const { top, bottom } = img.getBoundingClientRect()
//         if(top<window.innerHeight&&bottom>0){
//             // 图片需要显示了
//             img.src = img.dataset.src
//         } 
//     },200)
// }

// function throttle(func, wait) {
//     let previous = 0;
//     let context = this;
//     let timer = null;
//     return function () {
//       let now = Date.now();
//       let args = arguments;
//       clearTimeout(timer);
//       // 大于等待时间就执行
//       if (now - previous > wait) {
//         func.apply(context, args);
//         previous = now;
//       } else{
//           // 还有一种可能，在最后一次执行func后的wait毫秒内，又有滚动
//           // 但滚动时间又达不到wait毫秒的限制， 这次滚动显露出的图片就不会加载
//           // 使用定时器，如果再次触发滚动就清除定时器，否则，一段时间后自动执行加载函数func
//           timer = setTimeout(()=>{
//             func.apply(context, args)
//           },wait/2)
//       }
//     };
// }

// // window.addEventListener('scroll', throttle(loadImg, 300))
// // loadImg();

// function useCustomViewPort(selector){
//     const viewPort = document.querySelector(selector)
//     viewPort?.addEventListener('scroll', throttle(loadImg, 200))
//     loadImg();
// }
// useCustomViewPort('#image-container')

new LazyLoad('img')