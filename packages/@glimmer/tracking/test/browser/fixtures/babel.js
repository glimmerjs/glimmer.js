import { tracked } from '@glimmer/tracking';

export class Tom {
  @tracked firstName = 'Tom';
}

export class Toran {
  @tracked firstName = 'Toran';
  lastName = 'Billups';
}

class FrozenToran {
  @tracked firstName = 'Toran';
  lastName = 'Billups';
}

Object.freeze(FrozenToran);

export { FrozenToran };

export class PersonWithCount {
  _firstName = 'Tom';
  _count = 0;

  @tracked get firstName() {
    return this._firstName + this._count++;
  }

  set firstName(value) {
    this._firstName = value;
  }
}

export  class PersonWithSalutation {
  @tracked get salutation() {
    return `Hello, ${this.fullName}!`;
  }

  @tracked get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  set fullName(fullName) {
    let [firstName, lastName] = fullName.split(' ');
    this.firstName = firstName;
    this.lastName = lastName;
  }

  @tracked firstName = 'Tom';
  @tracked lastName = 'Dale';
}

export class Contact {
  @tracked email;
  @tracked person;

  constructor(person, email) {
    this.person = person;
    this.email = email;
  }

  @tracked get contact() {
    return `${this.person} @ ${this.email}`;
  }
}

export class PersonForContact {
  @tracked get salutation() {
    return `Hello, ${this.fullName}!`;
  }

  @tracked get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  set fullName(fullName) {
    let [firstName, lastName] = fullName.split(' ');
    this.firstName = firstName;
    this.lastName = lastName;
  }

  toString() {
    return this.fullName;
  }

  @tracked firstName = 'Tom';
  @tracked lastName = 'Dale';
}

export function createClassWithTrackedDependentKeys() {
  class DependentKeysAreCool {
    @tracked('firstName', 'lastName') fullName() {
      return `${this.firstName} ${this.lastName}`;
    }

    @tracked firstName = 'Tom';
    @tracked lastName = 'Dale';
  }
  return new DependentKeysAreCool();
}

export function createClassWithTrackedAsDecoratorFactory() {
  class DependentKeysAreCool {
    @tracked() fullName() {
      return `${this.firstName} ${this.lastName}`;
    }

    @tracked firstName = 'Tom';
    @tracked lastName = 'Dale';
  }
  return new DependentKeysAreCool();
}