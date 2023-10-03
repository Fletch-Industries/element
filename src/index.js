const { get, set, remove } = require('babbage-kvstore') // Assuming kvstore is available in your environment
const ESSerializer = require('esserializer')

/**
 * Defines a base class that can be derived from for child classes that implement new functionality
 * Element allows generic JS / TS classes to be instantiated as normal, but their state (and code) is stored on chain.
 * This brings the immutable nature of the blockchain to the power of OOP in a easy to learn way.
 * I should note, this is not the same as contract deployed on-chain which denotes a locking script for a UTXO.
 */
class Element {
  constructor(identifier, initialState = {}) {
    this.identifier = identifier
    this.state = initialState
  }

  async updateData(newData) {
    this.state = { ...this.state, ...newData }
    await this.saveState()
  }

  async getState() {
    await this.loadState()
    return this.state
  }

  async saveState() {
    const serializedState = JSON.stringify(this.state)
    await set(this.identifier, serializedState)
  }

  async loadState() {
    const storedState = await get(this.identifier)
    if (storedState) {
      this.state = JSON.parse(storedState)
    }
  }

  async update(newData) {
    await this.updateData(newData)
  }

  toJSON() {
    return this.state
  }


  // Serialize the Element class
  serialize() {
    const className = Element.name;
    const properties = Object.getOwnPropertyNames(Element.prototype).filter(prop => prop !== 'constructor');
    const methods = Object.getOwnPropertyNames(Element.prototype).filter(prop => typeof Element.prototype[prop] === 'function');
  
    return JSON.stringify({
      className,
      properties,
      methods
    });
  }

  // Deserialize the Element class
  static deserialize(data) {
    const element = new Element(data.identifier, data.state);

    // Restore methods
    data.methods.forEach(method => {
      element[method] = this.prototype[method];
    });

    return element;
  }

  static serializeClass() {
    const properties = Object.getOwnPropertyNames(Element.prototype).filter(prop => prop !== 'constructor');
    const methods = Object.getOwnPropertyNames(Element.prototype).filter(prop => typeof Element.prototype[prop] === 'function');
  
    return {
      properties,
      methods
    };
  }

  static createClassFromDefinition(definition) {
    const { properties, methods } = definition;
  
    const classDefinition = `
      return class NewClass {
        constructor(${properties.join(', ')}) {
          ${properties.map(prop => `this.${prop} = ${prop};`).join('\n')}
        }
  
        ${methods.map(method => `${method}() {}`).join('\n')}
      }
    `;
  
    return new Function(classDefinition)();
  }
}

class VotingCandidate extends Element {
  constructor(candidateName) {
    super(`candidate_${candidateName}`, { votes: 0 })
    this.candidateName = candidateName
  }

  async getCandidateName() {
    return this.candidateName
  }

  async getVotes() {
    return this.getState().then(state => state.votes)
  }

  async voteFor() {
    const currentVotes = await this.getState().then(state => state.votes)
    await this.update({ votes: currentVotes + 1 })
  }
}

// class EditableElement extends Element {
//   constructor() {
//     super()
//   }

//   async edit(message) {
//     await this.update({ message })
//   }
// }

// class Car extends SuperElement {
//   constructor(id, color, model) {
//     // let id = crypto.randomUUID()
//     // console.log(id)
//     super(id, { color, model })

//     // Define property getters and setters
//     Object.defineProperty(this, 'color', {
//       get: async function () {
//         const state = await this.getState()
//         return state.color
//       },
//       set: async function (newColor) {
//         await this.updateData({ color: newColor })
//       }
//     })

//     Object.defineProperty(this, 'model', {
//       get: async function () {
//         const state = await this.getState()
//         return state.model
//       },
//       set: async function (newModel) {
//         await this.updateData({ model: newModel })
//       }
//     })
//   }
// }

module.exports = { VotingCandidate, Element }