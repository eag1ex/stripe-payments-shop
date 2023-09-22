export namespace Customer {
    export interface LessonSession {
        date:string;
        /** index generated server side */
        index?:string;

        /**
         * @first_lesson current time + 9 days
         * @second_lesson current time + first_lesson + 5 days
         * @third_lesson current time + second_lesson + 7 days
         */
        type:'first_lesson'|'second_lesson' | 'third_lesson';
        timestamp:number;
    }

    export interface Metadata extends LessonSession{
        /** 
         * Only available on customer object
         * this being added once subscription schedule is created upon  @api api/schedule-lesson call 
         * */
        subscription_schedule_id?:string
    }
} 

export namespace SchedulePlanner {
    export type specificTimeSlots = 'five_days_or_after' |'any_day'
    export type timeSlots = 'not_set'|'too_early'|'five_days_due'|'less_then_five_days'| 'one_two_days_due'|'day_of'| 'pass_due'| specificTimeSlots
    
}

