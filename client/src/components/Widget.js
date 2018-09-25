import React, { Component } from 'react'
import Close from '../style/images/widget-close.svg'

export default class Widget extends Component {
  constructor(props) {
    super(props)
    this.state = {
      condition: false
    }
  }
  handleClick() {
    this.setState({
      condition: !this.state.condition
    })
  }

  render () {
    const active = this.state.condition ? "closed" : ""
    const slug = "card "+this.props.slug+" "+active
    const title = (this.props.title) ? <div className="card-header border-dark border-top border-bottom-0 pl-0 pb-2"><h5 className="card-title m-0">{this.props.title} <button ref="btn" onClick={() => this.handleClick()} className="close"><img src={Close} alt="" /></button></h5></div> : ''
    const children = (this.props.list) ? <div>{this.props.children}</div> : <div className="card-body">{this.props.children}</div>

    return (
      <div className={slug}>
        {title}
        <div className="inner">
          {children}
        </div>
      </div>
    )
  }
}
