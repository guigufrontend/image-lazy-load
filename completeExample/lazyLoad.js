
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