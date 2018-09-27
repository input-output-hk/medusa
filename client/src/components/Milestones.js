import React, { Component } from 'react'
import Widget from '../components/Widget'

export default class Milestones extends Component {
  render () {
    return (
      <Widget title='Milestones' slug='milestones' list={'true'}>
        <ul className='list-group list-group-flush'>
          <li className='list-group-item bg-transparent'>
            <h4 className='m-0'><a href='#'>Version 1.3 update merge</a></h4>
            <small>14. Feb 2018</small>
          </li>
          <li className='list-group-item bg-transparent'>
            <h4 className='m-0'><a href='#'>Ouroboros implementation</a></h4>
            <small>14. Feb 2018</small>
          </li>
          <li className='list-group-item bg-transparent'>
            <h4 className='m-0'><a href='#'>RINA implementation</a></h4>
            <small>14. Feb 2018</small>
          </li>
        </ul>
      </Widget>
    )
  }
}
