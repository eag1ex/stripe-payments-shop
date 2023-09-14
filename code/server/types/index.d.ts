export namespace Customer {
    export interface LessonSession {
        date:string;
        /** index generated server side */
        index?:string;
        type:'first_lesson'|'second_lesson' | 'third_lesson';
        timestamp:number;
    }
} 
