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
  @tracked _firstName = 'Tom';
  _count = 0;

  get firstName() {
    return this._firstName + this._count++;
  }

  set firstName(value) {
    this._firstName = value;
  }
}

export class PersonWithSalutation {
  get salutation() {
    return `Hello, ${this.fullName}!`;
  }

  get fullName() {
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
  @tracked email: string;
  @tracked person: PersonForContact;

  constructor(person: PersonForContact, email: string) {
    this.person = person;
    this.email = email;
  }

  get contact(): string {
    return `${this.person} @ ${this.email}`;
  }
}

export class PersonForContact {
  get salutation() {
    return `Hello, ${this.fullName}!`;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  set fullName(fullName: string) {
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

export function createClassWithTrackedGetter(): any {
  class PersonWithTrackedGetter {
    @tracked firstName = 'Tom';
    @tracked lastName;

    @tracked get salutation() {
      return `Hello, ${this.firstName} ${this.lastName}!`;
    }
  }

  return new PersonWithTrackedGetter();
}

export function createClassWithTrackedSetter(): any {
  class PersonWithTrackedSetter {
    @tracked firstName = 'Tom';
    @tracked lastName;

    @tracked set fullName(fullName) {
      let [firstName, lastName] = fullName.split(' ');
      this.firstName = firstName;
      this.lastName = lastName;
    }
  }

  return new PersonWithTrackedSetter();
}

export function createClassWithTrackedDependentKeys(): any {
  class DependentKeysAreCool {
    //@ts-ignore
    @tracked('firstName', 'lastName') fullName() {
      return `${this.firstName} ${this.lastName}`;
    }

    @tracked firstName = 'Tom';
    @tracked lastName = 'Dale';
  }
  return new DependentKeysAreCool();
}

export function createClassWithTrackedAsDecoratorFactory(): any {
  class DependentKeysAreCool {
    //@ts-ignore
    @tracked() fullName() {
      return `${this.firstName} ${this.lastName}`;
    }

    @tracked firstName = 'Tom';
    @tracked lastName = 'Dale';
  }
  return new DependentKeysAreCool();
}
