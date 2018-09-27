import React, {Component} from 'react'
import Close from '../style/images/close-side.svg'

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
            <button ref='btn' onClick={this.handleClick.bind(this)} className='close-sidebar'><img src={Close} alt='' /></button>
            {this.props.children}
          </div>
        </div>
      )
    }
  }
}
