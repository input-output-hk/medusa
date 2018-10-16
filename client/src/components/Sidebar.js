import React, {Component} from 'react'
import Close from '../style/images/close-side.svg'

import { IconContext } from "react-icons";
import { FaChevronLeft,FaInfoCircle } from 'react-icons/fa';

export default class Sidebar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      condition: false
    }
  }

  handleClick () {
    this.setState({
      condition: !this.state.condition
    })
  }

  render () {
    if (this.props.config.display.showSidebar) {
      return (
        <div className={this.state.condition ? 'UI-sidebar active' : 'UI-sidebar'}>
          <div className='content'>
            <button ref='btn' onClick={this.handleClick.bind(this)} className='close-sidebar'><FaChevronLeft /></button>
            <div className="mobile-top">
              <div className="row">
                <div className="col">
                  <span>{this.props.currentDate}</span>
                </div>
                <div className="col text-right">
                  <span><button ref='btn' onClick={this.handleClick.bind(this)} className='close-info'><FaInfoCircle /></button></span>
                </div>
              </div>
            </div>
            {this.props.children}
          </div>
        </div>
      )
    }
  }
}
