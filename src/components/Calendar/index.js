import { useEffect, useState } from 'react';
import styles from './Calendar.module.scss'

export default function Calendar(){

    const dateRanges = ["2023-01-06","2023-01-07","2023-01-09","2023-02-01"]
    let [_dateChoose, _setDateChoose] = useState([])

    function isDateInArray(needle, haystack) {
        for (var i = 0; i < haystack.length; i++) {
          if (needle.getMonth() === new Date(haystack[i]).getMonth() && needle.getFullYear() === new Date(haystack[i]).getFullYear()) {
            return true;
          }
        }
        return false;
    }
      
    function searchDate(){
        let uniqueDate = []

        dateRanges.forEach( val => {
            if(!isDateInArray(new Date(val), uniqueDate)){
                uniqueDate.push(val)
            }
        })

        console.log(uniqueDate)
    }   

    useEffect(() => {
        searchDate()
    }, [])

    return (
        <div className={styles.container}>
            <div className={styles.calendar}>
                <div className={styles.front}>
                    <div className={styles.current_date}>
                        <h1>January 2016</h1>	
                    </div>

                    <div className={styles.current_month}>
                        <ul className={styles.week_days}>
                            <li>MIN</li>
                            <li>SEN</li>
                            <li>SEL</li>
                            <li>RAB</li>
                            <li>KAM</li>
                            <li>JUM</li>
                            <li>SAB</li>
                        </ul>

                        <div className={styles.weeks}>
                            <div className={styles.first}>
                                <span className={styles.last_month}>28</span>
                                <span className={styles.last_month}>29</span>
                                <span className={styles.last_month}>30</span>
                                <span className={styles.last_month}>31</span>
                                <span>01</span>
                                <span>02</span>
                                <span>03</span>
                            </div>

                            <div className={styles.second}>
                                <span>04</span>
                                <span>05</span>
                                <span className={styles.event}>06</span>
                                <span>07</span>
                                <span>08</span>
                                <span>09</span>
                                <span>10</span>
                            </div>

                            <div className={styles.third}>
                                <span>11</span>
                                <span>12</span>
                                <span>13</span>
                                <span>14</span>
                                <span className={styles.active}>15</span>
                                <span>16</span>
                                <span>17</span>
                            </div>

                            <div className={styles.fourth}>
                                <span>18</span>
                                <span>19</span>
                                <span>20</span>
                                <span>21</span>
                                <span>22</span>
                                <span>23</span>
                                <span>24</span>
                            </div>

                            <div className={styles.fifth}>
                                <span>25</span>
                                <span>26</span>
                                <span>27</span>
                                <span>28</span>
                                <span>29</span>
                                <span>30</span>
                                <span>31</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}