//the draggable, resizable, collapsible creature editor card
const FloatingWindow={
    init(onChange){
        this.onChange=onChange;
        this.element=document.getElementById('editor-window');
        const header=this.element.querySelector('header');
        let grab=null;
        header.addEventListener('pointerdown',e=>{
            if(e.target.closest('button'))
                return;
            const box=this.element.getBoundingClientRect();
            grab=[e.clientX-box.left,e.clientY-box.top];
            header.setPointerCapture(e.pointerId);
        });
        header.addEventListener('pointermove',e=>{
            if(grab)
                this.moveTo(e.clientX-grab[0],e.clientY-grab[1]);
        });
        const release=()=>grab=null;
        header.addEventListener('pointerup',release);
        header.addEventListener('pointercancel',release);
        window.addEventListener('resize',()=>{
            if(this.isOpen())
                this.moveTo(this.element.offsetLeft,this.element.offsetTop);
        });
        $('#editor-collapse').click(()=>{
            $(this.element).toggleClass('collapsed');
            $('#editor-collapse i').toggleClass('fa-chevron-up fa-chevron-down');
            this.onChange(this.isActive());
        });
        $('#editor-close').click(()=>this.close());
    },

    //keeps the header reachable
    moveTo(x,y){
        const width=this.element.offsetWidth;
        this.element.style.left=Math.max(80-width,Math.min(x,window.innerWidth-80))+'px';
        this.element.style.top=Math.max(0,Math.min(y,window.innerHeight-40))+'px';
    },

    isOpen(){
        return this.element.style.display=='flex';
    },

    isActive(){
        return this.isOpen()&&!this.element.classList.contains('collapsed');
    },

    open(){
        const was_active=this.isActive();
        this.element.style.display='flex';
        if(this.element.classList.contains('collapsed'))
            $('#editor-collapse').click();
        else if(!was_active)
            this.onChange(true);
    },

    close(){
        this.element.style.display='none';
        this.onChange(false);
    },
}

module.exports=FloatingWindow;
