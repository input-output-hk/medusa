import React, { Component } from 'react'
import Committed from '../style/images/leg-committed.svg'
import Updated from '../style/images/leg-new.svg'
import Cold from '../style/images/leg-cold.svg'

export default class Legend extends Component {
  render () {
    return (
      <div className='legend'>
        <div className='inner'>
          <ul className='nolist'>
            <li><img src={Committed} alt='' /> <span>{this.props.config.legend.committed.title}</span></li>
            <li><img src={Updated} alt='' /> <span>{this.props.config.legend.updated.title}</span></li>
            <li><img src={Cold} alt='' /> <span>{this.props.config.legend.cold.title}</span></li>
          </ul>
        </div>
      </div>
    )
  }
}
