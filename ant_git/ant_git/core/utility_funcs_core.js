const utility_funcs_core = {

    now: () => {
        const now = new Date();
        return 
            now.getFullYear()                                   + "-" + 
            (now.getMonth() + 1).toString().padStart(2, '0')    + "-" + 
            now.getDate().toString().padStart(2, '0')           + " " + 
            now.getHours().toString().padStart(2, '0')          + ":" + 
            now.getMinutes().toString().padStart(2, '0');
    },

    is_bigger_date: (d1, d2) => {
        return new Date(d1).getTime() > new Date(d2).getTime();
    },

    is_smaller_date: (d1, d2) => {
        return new Date(d1).getTime() < new Date(d2).getTime();
    },

    are_equals_date: (d1, d2) => {
        return new Date(d1).getTime() == new Date(d2).getTime();
    },

    elapsed_minutes_between_dates: (d1, d2) => {
        const d1_ = d1.split(" ").join("T") + ":00";
        const d2_ = d2.split(" ").join("T") + ":00";
        const difference = new Date(d1_).getTime() - new Date(d2_).getTime();
        return (difference / 60000);
    },

    get_valid_intervals_between_two_dates: (d1, d2) => {

        const minutes   = this.utility_funcs_core.elapsed_minutes_between_dates(d2, d1);
        let d1_         = new Date(d1);
        let intervals   = [];

        if(minutes <= 0){
            return [d1_.getHours().toString().padStart(2, '0') + ":" + d1_.getMinutes().toString().padStart(2, '0')];
        }

        for(let m = 0; m < minutes; m++){
            if(m == 0){
                intervals.push(d1_.getHours().toString().padStart(2, '0') + ":" + d1_.getMinutes().toString().padStart(2, '0'));    
            }
            d1_.setMinutes(d1_.getMinutes() + 1);
            intervals.push(d1_.getHours().toString().padStart(2, '0') + ":" + d1_.getMinutes().toString().padStart(2, '0'));
        }

        return intervals;
    }

};

exports.utility_funcs_core = utility_funcs_core;