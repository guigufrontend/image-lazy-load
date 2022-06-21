# image-lazy-load
 图片懒加载

## 前言
最近公司项目接到了一个需求。我们有一个很多的目录，每一个目录都有一个数据量不小的详情（单个接口请求没有问题）。要求在页面一侧把目录显示出来，另一侧显示对应目录的详情。当用户不断上划或下划的过程中去加载对应的目录的详情。这和图片懒加载不能说一模一样，简直就是完全一样。
## 图片懒加载的场景
就像上面的场景一样，现在浏览器中很多图片分辨率较高，图片质量较大，有些网站图片数量还很多。这就导致了
1. 图片较大就导致单个图片加载较慢。
2. 图片过多，就会同时加载多个图片资源。由于浏览器在同一个域名下一次性发起的请求数是有限制的。这就会导致后面的请求排队阻塞。

因此如果一次性加载所有的图片，无疑会严重拖慢网页加载速度。
## 图片懒加载的原理
既然一次性加载过多的图片会导致请求排队，那么我们先加载用户可视区域内的图片，来减少加载数量。等到用户滑动页面，其他图片移动到可视区域内再加载这些图片。

图片的加载我们使用img标签的src属性，只要image标签有src属性，浏览器就会加载对应的图片资源。那么我们只要初始的时候不给image标签src属性，当图片出现在可视区域内再给src赋值，那么就能做到图片懒加载了。

剩下的重点就是如何判断图片是否已经出现在可视区域内了。

## 方法一
通过图片元素距离屏幕上边沿的高度和浏览器可视区域高度相比。
浏览器窗口的视口（viewport）高度可以使用 `window.innerHeight`<br>
而`Element.getBoundingClientRect()` 方法返回一个 DOMRect 对象，其提供了元素的大小及其相对于视口的位置。<br>
DOMRect对象中包含top、bottom、left、right、width、height、x、y,8个属性。每个属性的含义如下图所示
![getBoundingClientRect](/assets/img/getBoundingClientRect.png "getBoundingClientRect")
那么图片已经进入视口的判断就是
```js
// 获取所有图片
const images = Array.from(document.getElementsByTagName('img'));
images.forEach(img=>{
    // 获取单个图片距离视口顶部的距离
    const { top } = img.getBoundingClientRect()
    // 如果距离视口顶部比视口高度小，那么图片需要显示
    if(top<window.innerHeight){
        // 图片需要显示了
        img.src = img.dataset.src
    }
})
```

只要在页面第一次进入和页面滚动的时候查看每张图片是否应该显示就可以了
```js

const images = Array.from(document.getElementsByTagName('img'));

function loadImg(){
    images.forEach(img=>{
        const { top } = img.getBoundingClientRect()
        if(top<window.innerHeight){
            // 图片需要显示了
            img.src = img.dataset.src
        }
    })
}
// 浏览器滚动的时候执行加载函数
window.addEventListener('scroll', loadImg)
// 首次进入的时候判断是否加载
loadImg()
```

这时候还有几个问题没有解决
1. 只判断了图片顶部超过了浏览器底部，没有判断图片是不是已经在浏览器顶部之上了，如果用户使用某些锚点直接定位在了比较靠下的位置，或者浏览器记录了之前用户滚动的位置，我们还加载超出浏览器的图片就浪费性能了
2. onScroll函数触发太过频繁，应当使用节流函数节约性能
3. 如果用户滑动非常的快，表示这部分图片用户可能不关注，那么我们也可以不去加载它
4. 如果滚动的不是window怎么办？
5. 上边代码images、各种函数都分散在外，可以封装起来便于使用
   
首先解决第一个问题，不只判断顶部，也判断一下底部
```js
function loadImg(){
    images.forEach(img=>{
        const { top, bottom } = img.getBoundingClientRect()
        if(top<window.innerHeight&&bottom>0){
            img.src = img.dataset.src
        }
    })
}
```
解决第二个问题，写一个节流函数
```js
function throttle(func, wait) {
    let previous = 0;
    let context = this;
    let timer = null;
    return function () {
      let now = Date.now();
      let args = arguments;
      clearTimeout(timer);
      // 大于等待时间就执行
      if (now - previous > wait) {
        func.apply(context, args);
        previous = now;
      } else{
          // 还有一种可能，在最后一次执行func后的wait毫秒内，又有滚动
          // 但滚动时间又达不到wait毫秒的限制， 这次滚动显露出的图片就不会加载
          // 使用定时器，如果再次触发滚动就清除定时器，否则，一段时间后自动执行加载函数func
          timer = setTimeout(()=>{
            func.apply(context, args)
          },wait/2)
      }
    };
  }
  // 运用节流函数
  window.addEventListener('scroll', throttle(loadImg, 100))
```
当节流函数写完之后，快速滑动页面，只要在300毫秒内图片已经不在视口之内，图片就不会再加载了。但是，如果快速滑动的时间稍长，那么在节流函数执行时，正好处于视口内的图片也会加载，实际上，这些图片也可能是被快速略过的图片，也就是需要解决的问题3。<br>
我使用一个函数延迟一些时间之后，再次判断这个图片是不是还在视口之内，如果还在视口之内就加载它。
```js
// 延迟200毫秒之后再次判断图片是否在可视区域内
function delayJudge(img){
    setTimeout(()=>{
        const { top, bottom } = img.getBoundingClientRect()
        if(top<window.innerHeight&&bottom>0){
            // 图片需要显示了
            img.src = img.dataset.src
        } 
    },200)
}
function loadImg(){
    images.forEach(img=>{
        const { top, bottom } = img.getBoundingClientRect()
        if(top<window.innerHeight&&bottom>0){
             // img.src = img.dataset.src
             // 使用这个延迟判断替换直接赋值
            delayJudge(img)
        }
    })
}
```
这样一来，就算用户一直滑动，中间也不会有图片加载了。

第四个问题是如果滚动的不是window，而是自己的一个容器，那么就给这个容器添加`scroll`事件
```html
        <!-- index.html -->
        <div id="image-container">
            <img data-src="url1" />
            <img data-src="url2" />
        </div>
```
```css
#image-container{
    height: 500px;
    overflow: scroll;
}
```
```js
function useCustomViewPort(selector){
    const viewPort = document.querySelector(selector)
    viewPort?.addEventListener('scroll', throttle(loadImg, 200))
    loadImg();
}
useCustomViewPort('#image-container')
```

在解决上面一些问题的时候，写了很多函数，下一步就来把这些函数封装到一起。
```js
class LazyLoad{
    constructor(
        imageSelector,
        {container=window, throttleSec=200, delay=200} = {}
        ){
        this.images = document.querySelectorAll(imageSelector);
        this.container = container===window?window:document.querySelector(container)
        this.throttleSec = throttleSec
        this.delay = delay
        this.onViewPortScroll()
    }
    onViewPortScroll(){
        this.container.addEventListener(
            'scroll', 
            this.throttle(this.loadImg, this.throttleSec).bind(this)
        )
        this.loadImg();
    }
    delayJudge(img){
        setTimeout(()=>{
            const { top, bottom } = img.getBoundingClientRect()
            if(top<window.innerHeight&&bottom>0){
                // 图片需要显示了
                img.src = img.dataset.src
            } 
        },this.delay)
    }
    
    loadImg(){
        this.images.forEach(img=>{
            const { top, bottom } = img.getBoundingClientRect()
            if(top<window.innerHeight&&bottom>0){
                this.delayJudge(img)
            }
        })
    }
    throttle(func, wait) {
        let previous = 0;
        let context = this;
        let timer = null;
        return function () {
          let now = Date.now();
          let args = arguments;
          clearTimeout(timer);
          // 大于等待时间就执行
          if (now - previous > wait) {
            func.apply(context, args);
            previous = now;
          } else{
              // 还有一种可能，在最后一次执行func后的wait毫秒内，又有滚动
              // 但滚动时间又达不到wait毫秒的限制， 这次滚动显露出的图片就不会加载
              // 使用定时器，如果再次触发滚动就清除定时器，否则，一段时间后自动执行加载函数func
              timer = setTimeout(()=>{
                func.apply(context, args)
              },wait/2)
          }
        };
    }
}
new LazyLoad('img')
```
为了给用户比较好的体验，在图片未加载的时候可以给图片一个loading状态。
```js
initImg(){
        this.images.forEach(item=>{
            item.src = './assets/img/loading.gif'
        })
        this.onViewPortScroll();
    }
```
这样，我的图片懒加载就基本完成了
## 方法二 使用IntersectionObserver接口
MDN上的解释：
>IntersectionObserver接口 (从属于Intersection Observer API) 提供了一种异步观察目标元素与其祖先元素或顶级文档视窗 (viewport) 交叉状态的方法。祖先元素与视窗 (viewport) 被称为根 (root)。

>当一个IntersectionObserver对象被创建时，其被配置为监听根中一段给定比例的可见区域。一旦 IntersectionObserver 被创建，则无法更改其配置，所以一个给定的观察者对象只能用来监听可见区域的特定变化值；然而，你可以在同一个观察者对象中配置监听多个目标元素。

```js
    // 先获取observer对象
    const observer = new IntersectionObserver((entries, observer)=>{
        // 当元素可见比例超过配置的阈值后，会触发这个回调
        // 其中第一个参数描述了触发的元素与配置的视口的交叉状态
        // 其中entries.isIntersecting boolean类型描述了目标是否与视口相交
        // 第二个参数是被调用的IntersectionObserver实例
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                entry.target.src = entry.target.dataset.src
            }
        })
    },
    // 这是配置参数，可以配置root、rootMargin和threshold三个属性
    // root 指定被看做视口的区域
    // threshold指定监听目标与视口交叉比例为多少的时候会触发回调, 默认为0
    {root}
    );

    // 再使用IntersectionObserver.observe()来监听元素
    images.forEach(img=>{
        observer.observe(img)
    })
```

来使用Can I Use来看一下这个API的兼容情况
![IntersectionObserver](/assets/img/canIuse.jpg )
可以看到IE和Opera兼容性不好，如果要使用它，最好先判断这个API是否能用，不能用的话可以降级到第一种方法。
## 方法三
chrome 浏览器支持了图片懒加载，只需要在懒加载的图片标签上使用loading属性，指定值为lazy就开启了图片懒加载，可以说是非常方便了，但是要注意兼容性
![IntersectionObserver](/assets/img/lazyLoading.jpg )
```html
<img src="https:/xxx.jpg" loading="lazy" />
```

完整的代码如下：
```js
class LazyLoad{
    constructor(
        imageSelector,
        {container=window, throttleSec=200, delay=200} = {}
        ){
        this.images = document.querySelectorAll(imageSelector);
        this.container = container===window?window:document.querySelector(container)
        this.throttleSec = throttleSec
        this.delay = delay
        this.initImg()
    }
    initImg(){
        this.images.forEach(item=>{
            item.src = '../assets/img/loading.gif'
        })
        if('IntersectionObserver' in window){
            this.observeImg()
        }else if('loading' in HTMLImageElement.prototype){
            this.setLoadingLazy()
        }else{
            this.onViewPortScroll();
        }
    }
    setLoadingLazy(){
        setTimeout(()=>{
            this.images.forEach(img=>{
                img.loading = 'lazy'
                img.src =  img.dataset.src
            })
        },0)
    }
    observeImg(root){
        const option = this.container === window ? {}:{root:this.container}
        const observer = new IntersectionObserver((entries, observer)=>{
            // 当元素可见比例超过配置的阈值后，会触发这个回调
            // 其中第一个参数描述了触发的元素与配置的视口的交叉状态
            // 其中entries.isIntersecting boolean类型描述了目标是否与视口相交
            // 第二个参数是被调用的IntersectionObserver实例
            entries.forEach(entry=>{
                if(entry.isIntersecting){
                    this.delayJudge(entry.target)
                }
            })
        },
        // 这是配置参数，可以配置root、rootMargin和threshold三个属性
        // root 指定被看做视口的区域
        // threshold指定监听目标与视口交叉比例为多少的时候会触发回调, 默认为0
        option
        );
        // 可以使用IntersectionObserver.observe()来监听元素
        this.images.forEach(img=>{
            observer.observe(img)
        })
    }
    onViewPortScroll(){
        this.container.addEventListener(
            'scroll', 
            this.throttle(this.loadImg, this.throttleSec).bind(this)
        )
        this.loadImg();
    }
    delayJudge(img){
        setTimeout(()=>{
            const { top, bottom } = img.getBoundingClientRect()
            if(top<window.innerHeight&&bottom>0){
                // 图片需要显示了
                img.src = img.dataset.src
            } 
        },this.delay)
    }
    
    loadImg(){
        this.images.forEach(img=>{
            const { top, bottom } = img.getBoundingClientRect()
            if(top<window.innerHeight&&bottom>0){
                this.delayJudge(img)
            }
        })
    }
    throttle(func, wait) {
        let previous = 0;
        let context = this;
        let timer = null;
        return function () {
          let now = Date.now();
          let args = arguments;
          clearTimeout(timer);
          // 大于等待时间就执行
          if (now - previous > wait) {
            func.apply(context, args);
            previous = now;
          } else{
              // 还有一种可能，在最后一次执行func后的wait毫秒内，又有滚动
              // 但滚动时间又达不到wait毫秒的限制， 这次滚动显露出的图片就不会加载
              // 使用定时器，如果再次触发滚动就清除定时器，否则，一段时间后自动执行加载函数func
              timer = setTimeout(()=>{
                func.apply(context, args)
              },wait/2)
          }
        };
    }
}
```
## 参考文档

[MDN getBoundingClientRect](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect)

[MDN Intersection Observer](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver)

## 完整代码
[github 图片懒加载](https://github.com/guigufrontend/image-lazy-load)