import React, { Component } from 'react'
import Commited from '../style/images/leg-commited.svg'
import Updated from '../style/images/leg-new.svg'
import Cold from '../style/images/leg-cold.svg'

export default class Legend extends Component {
  render () {
    return (
      <div className='legend'>
        <div className='inner'>
          <ul className='nolist'>
            <li><img src={Commited} alt='' /> Committed file</li>
            <li><img src={Updated} alt='' /> Updated file</li>
            <li><img src={Cold} alt='' /> Cold file</li>
          </ul>
        </div>
      </div>
    )
  }
}
