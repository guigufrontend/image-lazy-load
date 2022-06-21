

const images = document.querySelectorAll('img')
function observeElement(root){
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
    // 可以使用IntersectionObserver.observe()来监听元素
    images.forEach(img=>{
        observer.observe(img)
    })
    
}
observeElement()